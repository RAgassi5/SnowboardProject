'use strict';
const { Op } = require('sequelize');
const { User, Resort, Trip, TripMember, TripMessage, TripReadStatus, FriendRequest } = require('../db');
const { chat } = require('../utils/llm');

// ── Weather helper ─────────────────────────────────────────────────────────────
// Inline subset of resortController weather logic — forecast/archive only;
// skips the expensive 3-year typical calculation for far-future trips.

const FORECAST_HORIZON_MS = 16 * 24 * 60 * 60 * 1000;
const OM_DAILY = 'temperature_2m_max,temperature_2m_min,snowfall_sum,wind_speed_10m_max';

async function dashboardWeather(resort, startDate, endDate) {
  const lat = resort?.latitude  != null ? parseFloat(resort.latitude)  : null;
  const lng = resort?.longitude != null ? parseFloat(resort.longitude) : null;
  if (!lat || !lng) return null;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const s = startDate ? new Date(startDate) : null;
  const e = endDate   ? new Date(endDate)   : null;

  if (s && s > new Date(Date.now() + FORECAST_HORIZON_MS)) return null; // too far ahead

  try {
    let url, confidence;
    if (!s || !e) {
      url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('forecast_days', '7');
      confidence = 'high';
    } else if (e < today) {
      url = new URL('https://archive-api.open-meteo.com/v1/archive');
      url.searchParams.set('start_date', startDate);
      url.searchParams.set('end_date', endDate);
      confidence = 'medium';
    } else {
      url = new URL('https://api.open-meteo.com/v1/forecast');
      const horizon = new Date(Date.now() + FORECAST_HORIZON_MS);
      url.searchParams.set('start_date', startDate);
      url.searchParams.set('end_date', e < horizon ? endDate : horizon.toISOString().split('T')[0]);
      confidence = 'high';
    }
    url.searchParams.set('latitude',  lat);
    url.searchParams.set('longitude', lng);
    url.searchParams.set('daily',     OM_DAILY);
    url.searchParams.set('timezone',  'auto');

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 4000);
    let resp;
    try {
      resp = await fetch(url.toString(), { signal: ac.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!resp.ok) return null;
    const { daily } = await resp.json();
    if (!daily?.time?.length) return null;

    const avg = arr => { const v = arr.filter(x => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
    const r1  = v => v != null ? Math.round(v * 10) / 10 : null;
    return {
      avgTempMax:    r1(avg(daily.temperature_2m_max)),
      avgTempMin:    r1(avg(daily.temperature_2m_min)),
      totalSnowfall: r1((daily.snowfall_sum ?? []).filter(v => v != null).reduce((s, v) => s + v, 0)),
      avgWindMax:    r1(avg(daily.wind_speed_10m_max)),
      confidence,
    };
  } catch {
    return null;
  }
}

// ── Unread counts (mirrors tripController.getUnreadCounts) ─────────────────────

async function computeUnreadCounts(userId, tripIds) {
  if (!tripIds.length) return {};
  const readStatuses = await TripReadStatus.findAll({
    where: { userId, tripId: { [Op.in]: tripIds } },
  });
  const lastReadMap = new Map(readStatuses.map(r => [r.tripId, r.lastReadAt]));
  const result = {};
  await Promise.all(tripIds.map(async (tid) => {
    const lastReadAt = lastReadMap.get(tid) ?? new Date(0);
    result[tid] = await TripMessage.count({
      where: { tripId: tid, userId: { [Op.ne]: userId }, createdAt: { [Op.gt]: lastReadAt } },
    });
  }));
  return result;
}

// ── Resort spotlight ───────────────────────────────────────────────────────────
// Same scoring formula as recommendResorts in aiController.

async function pickSpotlightResort(skillLevel, sportType) {
  const resorts = await Resort.findAll();
  if (!resorts.length) return null;

  const maxElev = Math.max(...resorts.map(r => r.elevation || 0));
  const scored = resorts.map(r => {
    const diffPenalty   = Math.abs(r.difficultyLevel - skillLevel) * 2.5;
    const elevBonus     = ((r.elevation || 0) / maxElev) * 3;
    const boardBonus    = (sportType === 'snowboard' && r.snowboardFriendly) ? 2 : 0;
    const freerideBonus = (skillLevel === 5 && r.terrainType === 'backcountry') ? 3 : 0;
    return { resort: r, score: 10 - diffPenalty + elevBonus + boardBonus + freerideBonus };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0].resort;

  let reason;
  try {
    const raw = await chat(
      'You are a ski advisor. Write ONE concise sentence (max 15 words) explaining why this resort suits this rider. No filler phrases.',
      `Resort: ${top.name} (${top.country}), Level ${top.difficultyLevel}/5, ${top.terrainType} terrain, ${top.elevation}m. Rider: Level ${skillLevel}/5 ${sportType}er.`,
      { maxTokens: 60, temperature: 0.5 }
    );
    reason = raw.trim();
  } catch {
    reason = `Level ${top.difficultyLevel} terrain in ${top.country}`;
  }

  return {
    resortId:          top.id,
    name:              top.name,
    country:           top.country,
    elevation:         top.elevation,
    terrainType:       top.terrainType,
    difficultyLevel:   top.difficultyLevel,
    snowboardFriendly: top.snowboardFriendly,
    reason,
  };
}

// ── Recent activity (last 7 days) ──────────────────────────────────────────────

async function buildRecentActivity(userId, createdTripIds) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [joinReqs, approvals, friendRequests] = await Promise.all([
    createdTripIds.length > 0
      ? TripMember.findAll({
          where: { tripId: { [Op.in]: createdTripIds }, status: 'pending', isInvitation: false, createdAt: { [Op.gte]: since } },
          include: [
            { model: User, attributes: ['id', 'firstName', 'lastName'] },
            { model: Trip, attributes: ['id', 'title', 'resortId'], include: [{ model: Resort, attributes: ['name'] }] },
          ],
          order: [['createdAt', 'DESC']],
        })
      : Promise.resolve([]),
    TripMember.findAll({
      where: { userId, status: 'approved', isInvitation: false, updatedAt: { [Op.gte]: since } },
      include: [{ model: Trip, attributes: ['id', 'title', 'resortId'], include: [{ model: Resort, attributes: ['name'] }] }],
      order: [['updatedAt', 'DESC']],
    }),
    FriendRequest.findAll({
      where: { receiverId: userId, status: 'pending', createdAt: { [Op.gte]: since } },
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
    }),
  ]);

  const activities = [];
  for (const m of joinReqs) {
    activities.push({
      type:      'join_request',
      tripName:  m.Trip?.title || m.Trip?.Resort?.name || `Trip #${m.tripId}`,
      userName:  `${m.User?.firstName ?? ''} ${m.User?.lastName ?? ''}`.trim() || 'Someone',
      timestamp: m.createdAt,
    });
  }
  for (const m of approvals) {
    activities.push({
      type:      'join_approved',
      tripName:  m.Trip?.title || m.Trip?.Resort?.name || `Trip #${m.tripId}`,
      timestamp: m.updatedAt,
    });
  }
  for (const fr of friendRequests) {
    activities.push({
      type:      'friend_request',
      userName:  `${fr.sender?.firstName ?? ''} ${fr.sender?.lastName ?? ''}`.trim() || 'Someone',
      timestamp: fr.createdAt,
    });
  }

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities.slice(0, 10);
}

// ── Main handler ───────────────────────────────────────────────────────────────

const getDashboard = async (req, res, next) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.', details: {} } });
    }

    // ── Phase 1: independent base queries ──────────────────────────────────────
    const [user, createdTrips, joinedMemberships, friendReqs, invitations] = await Promise.all([
      User.findByPk(userId),
      Trip.findAll({ where: { userId }, include: [Resort], order: [['startDate', 'ASC']] }),
      TripMember.findAll({
        where: { userId, status: 'approved' },
        include: [{ model: Trip, include: [Resort, { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }] }],
      }),
      FriendRequest.findAll({ where: { receiverId: userId, status: 'pending' } }),
      TripMember.findAll({
        where: { userId, status: 'pending', isInvitation: true },
        include: [{ model: Trip, include: [Resort, { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }] }],
      }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'User not found.', details: {} } });
    }

    // ── Derived collections ────────────────────────────────────────────────────
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const createdTripIds = createdTrips.map(t => t.id);

    const allCreated = createdTrips.map(t => ({
      tripId: t.id, userId: t.userId, resortId: t.resortId,
      startDate: t.startDate, endDate: t.endDate,
      title: t.title, skillLevel: t.skillLevel, sportType: t.sportType,
      privacy: t.privacy, maxMembers: t.maxMembers,
      resort: t.Resort,
      creator: null,
    }));

    const allJoined = joinedMemberships
      .filter(m => m.Trip)
      .map(m => ({
        tripId: m.Trip.id, userId: m.Trip.userId, resortId: m.Trip.resortId,
        startDate: m.Trip.startDate, endDate: m.Trip.endDate,
        title: m.Trip.title, skillLevel: m.Trip.skillLevel, sportType: m.Trip.sportType,
        privacy: m.Trip.privacy, maxMembers: m.Trip.maxMembers,
        resort: m.Trip.Resort,
        creator: m.Trip.creator,
      }));

    const allTrips    = [...allCreated, ...allJoined];
    const allTripIds  = [...new Set(allTrips.map(t => t.tripId))];

    const allUpcoming = allTrips
      .filter(t => t.startDate && new Date(t.startDate) >= today)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const nextTripRaw = allUpcoming[0] ?? null;

    const recentTripsRaw = [...allTrips]
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .slice(0, 5);

    const upcomingFor3 = allUpcoming.slice(0, 3);

    // ── Phase 2: parallel dependent queries ────────────────────────────────────
    const [
      pendingJoinsResult,
      unreadResult,
      nextWeatherResult,
      conditionsResult,
      nextMemberCountResult,
      activityResult,
      spotlightResult,
    ] = await Promise.allSettled([
      createdTripIds.length > 0
        ? TripMember.findAll({
            where: { tripId: { [Op.in]: createdTripIds }, status: 'pending', isInvitation: false },
            include: [
              { model: User, attributes: ['id', 'firstName', 'lastName'] },
              { model: Trip, attributes: ['id', 'title', 'resortId'], include: [{ model: Resort, attributes: ['name'] }] },
            ],
          })
        : Promise.resolve([]),
      computeUnreadCounts(userId, allTripIds),
      nextTripRaw?.resort
        ? dashboardWeather(nextTripRaw.resort, nextTripRaw.startDate, nextTripRaw.endDate)
        : Promise.resolve(null),
      Promise.all(upcomingFor3.map(t =>
        t.resort ? dashboardWeather(t.resort, t.startDate, t.endDate) : Promise.resolve(null)
      )),
      nextTripRaw
        ? TripMember.count({ where: { tripId: nextTripRaw.tripId, status: 'approved' } })
        : Promise.resolve(0),
      buildRecentActivity(userId, createdTripIds),
      pickSpotlightResort(user.skillLevel, user.sportType),
    ]);

    const pendingJoins      = pendingJoinsResult.status      === 'fulfilled' ? pendingJoinsResult.value      : [];
    const unreadMap         = unreadResult.status             === 'fulfilled' ? unreadResult.value             : {};
    const nextWeather       = nextWeatherResult.status        === 'fulfilled' ? nextWeatherResult.value        : null;
    const conditionsWeather = conditionsResult.status         === 'fulfilled' ? conditionsResult.value         : upcomingFor3.map(() => null);
    const nextMemberCount   = nextMemberCountResult.status    === 'fulfilled' ? nextMemberCountResult.value    : 0;
    const recentActivity    = activityResult.status           === 'fulfilled' ? activityResult.value           : [];
    const spotlight         = spotlightResult.status          === 'fulfilled' ? spotlightResult.value          : null;

    // ── Phase 3: AI suggestions ────────────────────────────────────────────────
    let aiSuggestions = null;
    if (nextTripRaw) {
      try {
        const w = nextWeather;
        const weatherCtx = w
          ? ` Weather: avg ${w.avgTempMin}°C–${w.avgTempMax}°C, ${w.totalSnowfall ?? 0}cm snow, ${w.avgWindMax} kph wind.`
          : '';
        const raw = await chat(
          'You are a concise trip advisor. Return ONLY a valid JSON array of exactly 4 short strings (max 10 words each) — practical packing or preparation tips for this specific trip.',
          `Resort: ${nextTripRaw.resort?.name ?? 'Unknown'}, ${nextTripRaw.resort?.country ?? ''}. Terrain: ${nextTripRaw.resort?.terrainType ?? 'mixed'}. Rider: ${user.sportType}, Level ${user.skillLevel}. Dates: ${nextTripRaw.startDate} → ${nextTripRaw.endDate}.${weatherCtx}`,
          { maxTokens: 200, temperature: 0.6, json: true }
        );
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          aiSuggestions = parsed.slice(0, 4);
        } else if (parsed?.suggestions && Array.isArray(parsed.suggestions)) {
          aiSuggestions = parsed.suggestions.slice(0, 4);
        } else if (parsed?.tips && Array.isArray(parsed.tips)) {
          aiSuggestions = parsed.tips.slice(0, 4);
        }
      } catch {
        aiSuggestions = null;
      }
    }

    // ── Assemble response ──────────────────────────────────────────────────────

    // nextTrip
    let nextTrip = null;
    if (nextTripRaw) {
      const daysRemaining = Math.ceil((new Date(nextTripRaw.startDate) - today) / (24 * 60 * 60 * 1000));
      nextTrip = {
        tripId:              nextTripRaw.tripId,
        title:               nextTripRaw.title,
        resortId:            nextTripRaw.resortId,
        resortName:          nextTripRaw.resort?.name ?? `Resort #${nextTripRaw.resortId}`,
        country:             nextTripRaw.resort?.country ?? '',
        startDate:           nextTripRaw.startDate,
        endDate:             nextTripRaw.endDate,
        daysRemaining,
        approvedMemberCount: nextMemberCount,
        maxMembers:          nextTripRaw.maxMembers,
        unreadCount:         unreadMap[nextTripRaw.tripId] ?? 0,
        weather:             nextWeather,
      };
    }

    // attentionItems
    const attentionItems = [];

    // Pending join requests (grouped by trip)
    const joinsByTrip = {};
    for (const m of pendingJoins) {
      const tid = m.tripId;
      if (!joinsByTrip[tid]) {
        joinsByTrip[tid] = {
          tripId:   tid,
          tripName: m.Trip?.title || m.Trip?.Resort?.name || `Trip #${tid}`,
          members:  [],
        };
      }
      joinsByTrip[tid].members.push({
        memberId:      m.id,
        requesterName: `${m.User?.firstName ?? ''} ${m.User?.lastName ?? ''}`.trim() || 'Someone',
      });
    }
    for (const item of Object.values(joinsByTrip)) {
      attentionItems.push({
        type:          'join_request',
        tripId:        item.tripId,
        tripName:      item.tripName,
        requesterName: item.members.length === 1 ? item.members[0].requesterName : null,
        memberId:      item.members.length === 1 ? item.members[0].memberId : null,
        count:         item.members.length,
      });
    }

    if (friendReqs.length > 0) {
      attentionItems.push({ type: 'friend_requests', count: friendReqs.length });
    }
    if (invitations.length > 0) {
      attentionItems.push({ type: 'invitations', count: invitations.length });
    }

    for (const [tidStr, count] of Object.entries(unreadMap)) {
      if (count > 0) {
        const tid = parseInt(tidStr);
        const t   = allTrips.find(x => x.tripId === tid);
        if (t) {
          attentionItems.push({
            type:     'unread_messages',
            tripId:   tid,
            tripName: t.title || t.resort?.name || `Trip #${tid}`,
            count,
          });
        }
      }
    }

    for (const t of allUpcoming) {
      const daysUntil = Math.ceil((new Date(t.startDate) - today) / (24 * 60 * 60 * 1000));
      if (daysUntil > 0 && daysUntil <= 3) {
        attentionItems.push({
          type:     'trip_starting_soon',
          tripId:   t.tripId,
          tripName: t.title || t.resort?.name || `Trip #${t.tripId}`,
          daysUntil,
        });
      }
    }

    // conditionsWatch
    const conditionsWatch = upcomingFor3.map((t, i) => ({
      tripId:     t.tripId,
      resortName: t.resort?.name ?? `Resort #${t.resortId}`,
      country:    t.resort?.country ?? '',
      startDate:  t.startDate,
      endDate:    t.endDate,
      weather:    conditionsWeather[i] ?? null,
    }));

    // recentTrips
    const recentTrips = recentTripsRaw.map(t => ({
      tripId:     t.tripId,
      userId:     t.userId,
      resortId:   t.resortId,
      startDate:  t.startDate,
      endDate:    t.endDate,
      title:      t.title,
      skillLevel: t.skillLevel,
      sportType:  t.sportType,
      privacy:    t.privacy,
      maxMembers: t.maxMembers,
      resort: t.resort ? {
        resortId:          t.resort.id,
        name:              t.resort.name,
        country:           t.resort.country,
        elevation:         t.resort.elevation,
        terrainType:       t.resort.terrainType,
        difficultyLevel:   t.resort.difficultyLevel,
        snowboardFriendly: t.resort.snowboardFriendly,
      } : null,
      unreadCount: unreadMap[t.tripId] ?? 0,
      creator:     t.creator ? { firstName: t.creator.firstName, lastName: t.creator.lastName } : null,
    }));

    return res.json({
      success: true,
      data: {
        nextTrip,
        attentionItems,
        aiSuggestions,
        conditionsWatch,
        resortSpotlight: spotlight,
        recentActivity,
        recentTrips,
      },
      error: null,
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
