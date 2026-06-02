import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStoredRole,
  getAllUsers, deleteUser,
  getResorts, createResort, updateResort, deleteResort,
  getResortLocations, createLocation, updateLocation, deleteLocation,
} from '../services/api';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = ['Users', 'Resorts', 'Locations'];
const LOCATION_TYPES = ['lift', 'slope', 'restaurant', 'park', 'rental'];
const TERRAIN_TYPES  = ['groomed', 'mixed', 'off-piste', 'powder', 'park'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

// ── Component ─────────────────────────────────────────────────────────────────
function ManagementPage() {
  const navigate = useNavigate();
  const role = getStoredRole();

  const isAdmin   = role === 'admin';
  const isManager = role === 'manager';
  const canManage = isAdmin || isManager;

  // Must be before any conditional return to follow rules of hooks
  const [activeTab, setActiveTab] = useState('Users');

  // Redirect regular users
  if (!canManage) {
    return (
      <div className="page-content">
        <div style={styles.denied}>
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <h1 style={{ color: 'var(--accent-danger)', marginBottom: '0.5rem' }}>Access Denied</h1>
          <p>You need admin or manager privileges to access this area.</p>
          <button className="btn btn-secondary" style={{ marginTop: '1rem' }}
            onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🛠️ Management Area</h1>
        <p>Admin &amp; Manager tools — {role} access</p>
      </div>

      {/* Tab bar */}
      <div style={styles.tabs} role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            id={`mgmt-tab-${tab.toLowerCase()}`}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
          >
            {TAB_ICONS[tab]} {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div role="tabpanel">
        {activeTab === 'Users'    && <UsersTab    role={role} isAdmin={isAdmin} />}
        {activeTab === 'Resorts'  && <ResortsTab  role={role} isAdmin={isAdmin} />}
        {activeTab === 'Locations'&& <LocationsTab role={role} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}

const TAB_ICONS = { Users: '👥', Resorts: '🏔️', Locations: '📍' };

// ═════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ═════════════════════════════════════════════════════════════════════════════
function UsersTab({ role, isAdmin }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [confirm, setConfirm] = useState(null); // { userId, name }

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setUsers(await getAllUsers(role)); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    const { userId } = confirm;
    setConfirm(null);
    try {
      await deleteUser(userId, role);
      setUsers(prev => prev.filter(u => u.userId !== userId));
    } catch (e) { setError(e.message); }
  };

  const USER_COLUMNS = [
    { key: 'userId',    label: 'ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName',  label: 'Last Name' },
    { key: 'email',     label: 'Email',      render: v => v ?? '—' },
    { key: 'sportType', label: 'Sport',      render: v => v ?? '—' },
    { key: 'skillLevel',label: 'Skill',      render: v => v ?? '—' },
    { key: 'userRole',  label: 'Role',       render: v => <RoleBadge role={v} /> },
    { key: 'createDate',label: 'Created',    render: v => fmtDate(v) },
    ...(isAdmin ? [{
      key: '_actions', label: '',
      render: (_, row) => (
        <button id={`delete-user-${row.userId}`}
          className="btn btn-danger"
          style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
          onClick={() => setConfirm({ userId: row.userId, name: `${row.firstName} ${row.lastName}` })}>
          🗑 Delete
        </button>
      )
    }] : []),
  ];

  return (
    <section>
      <SectionHeader title="Manage Users" count={users.length}
        sub={isAdmin ? 'Admin can delete users' : 'Manager can view users'} />
      {loading && <LoadingSpinner message="Loading users…" />}
      <ErrorMessage message={error} onDismiss={() => setError('')} />
      {!loading && !error && (
        <DataTable id="users-table" columns={USER_COLUMNS} data={users}
          emptyMessage="No users found." />
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete User?"
          message={`Permanently delete ${confirm.name}? All their trips will remain but they won't be able to log in.`}
          confirmText="Delete User"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)} />
      )}
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RESORTS TAB
// ═════════════════════════════════════════════════════════════════════════════
const RESORT_BLANK = { name:'', country:'', elevation:'', terrainType:'groomed',
  difficultyLevel:'3', snowboardFriendly:true, latitude:'', longitude:'' };

function ResortsTab({ role, isAdmin }) {
  const [resorts,     setResorts]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editRow,     setEditRow]     = useState(null); // resort obj being edited
  const [form,        setForm]        = useState(RESORT_BLANK);
  const [formErrors,  setFormErrors]  = useState({});
  const [saving,      setSaving]      = useState(false);
  const [confirm,     setConfirm]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setResorts(await getResorts()); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const validateForm = (f) => {
    const e = {};
    if (!f.name.trim())    e.name    = 'Name is required.';
    if (!f.country.trim()) e.country = 'Country is required.';
    if (!f.elevation || isNaN(Number(f.elevation))) e.elevation = 'Valid elevation (m) required.';
    if (!f.difficultyLevel) e.difficultyLevel = 'Difficulty required.';
    if (!f.latitude  || isNaN(Number(f.latitude)))  e.latitude  = 'Valid latitude required.';
    if (!f.longitude || isNaN(Number(f.longitude)))  e.longitude = 'Valid longitude required.';
    return e;
  };

  const openAdd = () => { setForm(RESORT_BLANK); setFormErrors({}); setEditRow(null); setShowAddForm(true); };
  const openEdit = (r) => {
    setForm({
      name: r.name, country: r.country,
      elevation: String(r.elevation), terrainType: r.terrainType,
      difficultyLevel: String(r.difficultyLevel),
      snowboardFriendly: r.snowboardFriendly,
      latitude: String(r.latitude), longitude: String(r.longitude),
    });
    setFormErrors({}); setEditRow(r); setShowAddForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        name: form.name.trim(), country: form.country.trim(),
        elevation: Number(form.elevation), terrainType: form.terrainType,
        difficultyLevel: Number(form.difficultyLevel),
        snowboardFriendly: Boolean(form.snowboardFriendly),
        latitude: Number(form.latitude), longitude: Number(form.longitude),
      };
      if (editRow) {
        await updateResort(editRow.resortId, payload, role);
        setSuccess(`✅ ${form.name} updated.`);
      } else {
        await createResort(payload, role);
        setSuccess(`✅ ${form.name} added.`);
      }
      setShowAddForm(false); setEditRow(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const { resortId, name } = confirm;
    setConfirm(null);
    try {
      await deleteResort(resortId, role);
      setResorts(prev => prev.filter(r => r.resortId !== resortId));
      setSuccess(`✅ ${name} deleted.`);
    } catch (e) { setError(e.message); }
  };

  const RESORT_COLUMNS = [
    { key: 'resortId',       label: 'ID' },
    { key: 'name',           label: 'Resort' },
    { key: 'country',        label: 'Country' },
    { key: 'elevation',      label: 'Elevation (m)' },
    { key: 'terrainType',    label: 'Terrain' },
    { key: 'difficultyLevel',label: 'Level' },
    { key: 'snowboardFriendly', label: 'Board OK',
      render: v => <span style={{ color: v ? '#5eead4' : '#fcd34d' }}>{v ? '✅' : '⚠️'}</span> },
    { key: '_actions', label: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button id={`edit-resort-${row.resortId}`}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
            onClick={() => openEdit(row)}>
            ✏️ Edit
          </button>
          {isAdmin && (
            <button id={`delete-resort-${row.resortId}`}
              className="btn btn-danger"
              style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
              onClick={() => setConfirm({ resortId: row.resortId, name: row.name })}>
              🗑
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <section>
      <SectionHeader title="Manage Resorts" count={resorts.length}
        sub={isAdmin ? 'Admin can add, edit and delete resorts' : 'Manager can add and edit resorts'}>
        <button id="add-resort-btn" className="btn btn-primary"
          style={{ fontSize: '0.85rem' }} onClick={openAdd}>
          ＋ Add Resort
        </button>
      </SectionHeader>

      {loading && <LoadingSpinner message="Loading resorts…" />}
      <ErrorMessage message={error} onDismiss={() => setError('')} />
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <span>✅</span><span>{success}</span>
        </div>
      )}

      {/* Add / Edit form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            {editRow ? `Edit: ${editRow.name}` : 'Add New Resort'}
          </h3>
          <form onSubmit={handleSave} id="resort-form" noValidate>
            <div style={styles.formGrid}>
              <Field id="rf-name" label="Resort Name" error={formErrors.name}>
                <input id="rf-name" className={`form-input ${formErrors.name ? 'error' : ''}`}
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field id="rf-country" label="Country" error={formErrors.country}>
                <input id="rf-country" className={`form-input ${formErrors.country ? 'error' : ''}`}
                  value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
              </Field>
              <Field id="rf-elevation" label="Elevation (m)" error={formErrors.elevation}>
                <input id="rf-elevation" type="number" className={`form-input ${formErrors.elevation ? 'error' : ''}`}
                  value={form.elevation} onChange={e => setForm(p => ({ ...p, elevation: e.target.value }))} />
              </Field>
              <Field id="rf-terrain" label="Terrain Type">
                <select id="rf-terrain" className="form-input"
                  value={form.terrainType} onChange={e => setForm(p => ({ ...p, terrainType: e.target.value }))}>
                  {TERRAIN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field id="rf-difficulty" label="Difficulty (1–5)" error={formErrors.difficultyLevel}>
                <select id="rf-difficulty" className={`form-input ${formErrors.difficultyLevel ? 'error' : ''}`}
                  value={form.difficultyLevel}
                  onChange={e => setForm(p => ({ ...p, difficultyLevel: e.target.value }))}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field id="rf-board" label="Snowboard Friendly">
                <select id="rf-board" className="form-input"
                  value={String(form.snowboardFriendly)}
                  onChange={e => setForm(p => ({ ...p, snowboardFriendly: e.target.value === 'true' }))}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>
              <Field id="rf-lat" label="Latitude" error={formErrors.latitude}>
                <input id="rf-lat" type="number" step="any" className={`form-input ${formErrors.latitude ? 'error' : ''}`}
                  value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} />
              </Field>
              <Field id="rf-lng" label="Longitude" error={formErrors.longitude}>
                <input id="rf-lng" type="number" step="any" className={`form-input ${formErrors.longitude ? 'error' : ''}`}
                  value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" id="resort-form-submit" className="btn btn-primary" disabled={saving}>
                {saving ? '…' : editRow ? '💾 Save Changes' : '＋ Create Resort'}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => { setShowAddForm(false); setEditRow(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && !error && (
        <DataTable id="resorts-table" columns={RESORT_COLUMNS} data={resorts}
          emptyMessage="No resorts found." />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete Resort?"
          message={`Permanently delete ${confirm.name}? All associated data will be lost.`}
          confirmText="Delete Resort"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)} />
      )}
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LOCATIONS TAB
// ═════════════════════════════════════════════════════════════════════════════
const LOC_BLANK = { resortId: '', name: '', type: 'lift', description: '' };

function LocationsTab({ role, isAdmin }) {
  const [resorts,    setResorts]    = useState([]);
  const [selResort,  setSelResort]  = useState('');
  const [locations,  setLocations]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [editLoc,    setEditLoc]    = useState(null);
  const [form,       setForm]       = useState(LOC_BLANK);
  const [formErrors, setFormErrors] = useState({});
  const [saving,     setSaving]     = useState(false);
  const [confirm,    setConfirm]    = useState(null);

  // Load resort list for selector
  useEffect(() => {
    getResorts().then(setResorts).catch(() => {});
  }, []);

  // Load locations when resort selected
  useEffect(() => {
    if (!selResort) { setLocations([]); return; }
    setLoading(true); setError('');
    getResortLocations(selResort)
      .then(setLocations)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selResort]);

  const validateForm = (f) => {
    const e = {};
    if (!f.resortId) e.resortId = 'Resort is required.';
    if (!f.name.trim()) e.name = 'Name is required.';
    if (!f.type)    e.type  = 'Type is required.';
    return e;
  };

  const openAdd = () => {
    setForm({ ...LOC_BLANK, resortId: selResort });
    setFormErrors({}); setEditLoc(null); setShowForm(true);
  };
  const openEdit = (loc) => {
    setForm({
      resortId: String(loc.resortId), name: loc.name,
      type: loc.type, description: loc.description ?? '',
    });
    setFormErrors({}); setEditLoc(loc); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        resortId: Number(form.resortId), name: form.name.trim(),
        type: form.type, description: form.description.trim() || null,
      };
      if (editLoc) {
        await updateLocation(editLoc.locationId, payload, role);
        setSuccess(`✅ "${form.name}" updated.`);
      } else {
        await createLocation(payload, role);
        setSuccess(`✅ "${form.name}" added.`);
      }
      setShowForm(false); setEditLoc(null);
      // Refresh locations
      const updated = await getResortLocations(selResort);
      setLocations(updated);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const { locationId, name } = confirm;
    setConfirm(null);
    try {
      await deleteLocation(locationId, role);
      setLocations(prev => prev.filter(l => l.locationId !== locationId));
      setSuccess(`✅ "${name}" deleted.`);
    } catch (e) { setError(e.message); }
  };

  const LOC_COLUMNS = [
    { key: 'locationId',  label: 'ID' },
    { key: 'type',        label: 'Type',
      render: v => <span style={{ textTransform: 'capitalize' }}>{TYPE_ICONS[v]} {v}</span> },
    { key: 'name',        label: 'Name' },
    { key: 'description', label: 'Description', render: v => v ?? '—' },
    { key: '_actions',    label: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button id={`edit-loc-${row.locationId}`}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
            onClick={() => openEdit(row)}>
            ✏️ Edit
          </button>
          {isAdmin && (
            <button id={`delete-loc-${row.locationId}`}
              className="btn btn-danger"
              style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
              onClick={() => setConfirm({ locationId: row.locationId, name: row.name })}>
              🗑
            </button>
          )}
        </div>
      )
    },
  ];

  const selectedResortName = resorts.find(r => String(r.resortId) === selResort)?.name ?? '';

  return (
    <section>
      <SectionHeader title="Manage Locations"
        sub="Select a resort to view and manage its in-resort locations" />

      {/* Resort selector */}
      <div className="form-group" style={{ maxWidth: 360, marginBottom: '1.5rem' }}>
        <label htmlFor="loc-resort-select" className="form-label">Select Resort</label>
        <select id="loc-resort-select" className="form-input"
          value={selResort} onChange={e => setSelResort(e.target.value)}>
          <option value="">— Choose a resort —</option>
          {resorts.map(r => (
            <option key={r.resortId} value={String(r.resortId)}>{r.name} ({r.country})</option>
          ))}
        </select>
      </div>

      {selResort && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {locations.length} location{locations.length !== 1 ? 's' : ''} at <strong style={{ color: 'var(--text-primary)' }}>{selectedResortName}</strong>
            </span>
            <button id="add-location-btn" className="btn btn-primary"
              style={{ fontSize: '0.85rem' }} onClick={openAdd}>
              ＋ Add Location
            </button>
          </div>

          {/* Add / Edit form */}
          {showForm && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                {editLoc ? `Edit: ${editLoc.name}` : 'Add New Location'}
              </h3>
              <form onSubmit={handleSave} id="location-form" noValidate>
                <div style={styles.formGrid}>
                  <Field id="lf-resort" label="Resort" error={formErrors.resortId}>
                    <select id="lf-resort" className={`form-input ${formErrors.resortId ? 'error' : ''}`}
                      value={form.resortId}
                      onChange={e => setForm(p => ({ ...p, resortId: e.target.value }))}>
                      <option value="">— Select —</option>
                      {resorts.map(r => (
                        <option key={r.resortId} value={String(r.resortId)}>{r.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field id="lf-name" label="Location Name" error={formErrors.name}>
                    <input id="lf-name" className={`form-input ${formErrors.name ? 'error' : ''}`}
                      value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </Field>
                  <Field id="lf-type" label="Type" error={formErrors.type}>
                    <select id="lf-type" className={`form-input ${formErrors.type ? 'error' : ''}`}
                      value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field id="lf-desc" label="Description (optional)">
                    <input id="lf-desc" className="form-input"
                      value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </Field>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" id="location-form-submit"
                    className="btn btn-primary" disabled={saving}>
                    {saving ? '…' : editLoc ? '💾 Save' : '＋ Add'}
                  </button>
                  <button type="button" className="btn btn-secondary"
                    onClick={() => { setShowForm(false); setEditLoc(null); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {loading && <LoadingSpinner message="Loading locations…" />}
      <ErrorMessage message={error} onDismiss={() => setError('')} />
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <span>✅</span><span>{success}</span>
        </div>
      )}

      {!loading && selResort && !error && (
        <DataTable id="locations-table" columns={LOC_COLUMNS} data={locations}
          emptyMessage={`No locations found for this resort.`} />
      )}

      {!selResort && (
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <span className="empty-icon">📍</span>
          <h3>Select a resort above</h3>
          <p>Choose a resort from the dropdown to view and manage its locations.</p>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete Location?"
          message={`Permanently delete "${confirm.name}"?`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)} />
      )}
    </section>
  );
}

const TYPE_ICONS = { lift: '🚡', slope: '⛷️', restaurant: '🍽️', park: '🛹', rental: '🏪' };

// ── Shared sub-components ─────────────────────────────────────────────────────
function SectionHeader({ title, count, sub, children }) {
  return (
    <div style={styles.sectionHeader}>
      <div>
        <h2 style={styles.sectionTitle}>
          {title}
          {count !== undefined && (
            <span style={styles.countBadge}>{count}</span>
          )}
        </h2>
        {sub && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label htmlFor={id} className="form-label">{label}</label>
      {children}
      {error && <span className="form-error" role="alert">⚠ {error}</span>}
    </div>
  );
}

function RoleBadge({ role }) {
  const cls = { admin: 'badge badge-amber', manager: 'badge badge-teal', user: 'badge badge-blue' };
  return <span className={cls[role] ?? 'badge badge-blue'}>{role}</span>;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  denied: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '0.5rem',
  },
  tabs: {
    display: 'flex', gap: '0.5rem', marginBottom: '2rem',
    borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0',
  },
  tab: {
    padding: '0.6rem 1.2rem',
    background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: 600,
    transition: 'all 0.15s ease',
    fontFamily: 'var(--font-sans)',
  },
  tabActive: {
    color: 'var(--accent-light)',
    borderBottomColor: 'var(--accent-primary)',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: '1rem',
    flexWrap: 'wrap', marginBottom: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1.15rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: '0.2rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  countBadge: {
    fontSize: '0.75rem', fontWeight: 600,
    background: 'rgba(79,142,247,0.12)', color: 'var(--accent-light)',
    border: '1px solid rgba(79,142,247,0.2)',
    borderRadius: 'var(--radius-full)', padding: '0.1rem 0.55rem',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem', marginBottom: '0.25rem',
  },
};

export default ManagementPage;
