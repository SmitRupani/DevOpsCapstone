import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = '/api';

function App() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total_items: 0,
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
    total_valuation: 0,
  });
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockAmount, setRestockAmount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState([
    { id: 1, icon: '📦', text: 'System initialized with warehouse live sync', time: 'Just now' },
    { id: 2, icon: '✓', text: 'Prometheus metrics instrumented at /metrics', time: '2 min ago' },
    { id: 3, icon: '🚀', text: 'Kubernetes ingress routing verified', time: '10 min ago' },
  ]);

  const loadData = async () => {
    try {
      setError('');
      const [invRes, statsRes] = await Promise.all([
        fetch(`${API}/inventory`),
        fetch(`${API}/inventory/stats`),
      ]);

      if (!invRes.ok || !statsRes.ok) {
        throw new Error('Backend services unavailable');
      }

      const invData = await invRes.json();
      const statsData = await statsRes.json();
      setItems(invData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addActivity = (icon, text) => {
    setActivities((prev) => [
      { id: Date.now(), icon, text, time: 'Just now' },
      ...prev.slice(0, 4),
    ]);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchSearch =
        !search ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.warehouse_location.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [items, categoryFilter, statusFilter, search]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      sku: fd.get('sku'),
      name: fd.get('name'),
      category: fd.get('category'),
      quantity: parseInt(fd.get('quantity'), 10),
      min_threshold: parseInt(fd.get('min_threshold'), 10),
      unit_price: parseFloat(fd.get('unit_price')),
      warehouse_location: fd.get('warehouse_location'),
    };

    try {
      const res = await fetch(`${API}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create item');
      }

      addActivity('＋', `Added new item: ${payload.name} (${payload.sku})`);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockTarget) return;

    try {
      const res = await fetch(`${API}/inventory/${restockTarget.id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(restockAmount, 10) }),
      });

      if (!res.ok) throw new Error('Failed to restock item');

      addActivity('📦', `Restocked +${restockAmount} units of ${restockTarget.sku}`);
      setRestockTarget(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!confirm(`Delete ${item.name} (${item.sku}) from inventory?`)) return;

    try {
      const res = await fetch(`${API}/inventory/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');

      addActivity('🗑', `Removed item ${item.sku} from inventory`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">LT</div>
          <div>
            <b>LogiTrack</b>
            <small>DevOps Capstone</small>
          </div>
        </div>

        <nav>
          <a className="active">
            <span>▦</span> <span>Inventory</span>
          </a>
          <a>
            <span>📊</span> <span>Analytics</span>
          </a>
          <a>
            <span>🏬</span> <span>Warehouses</span>
          </a>
          <a>
            <span>📑</span> <span>Audit Trail</span>
          </a>
        </nav>

        <div className="side-bottom">
          <div className="env-badge">
            <strong>
              <span style={{ fontSize: '10px' }}>●</span> Production Ready
            </strong>
            <p>EKS • Helm • Prometheus</p>
          </div>

          <div className="profile">
            <div className="avatar">SR</div>
            <div>
              <b>Smit Rupani</b>
              <small>DevOps Engineer</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main">
        <header>
          <div>
            <p className="eyebrow">WAREHOUSE MANAGEMENT / OPERATIONS</p>
            <h1>Smart Inventory Hub 👋</h1>
            <p className="muted">
              Real-time SKU tracking, automated stock alerts, and replenishment workflows.
            </p>
          </div>
          <div className="actions-group">
            <button className="secondary" onClick={loadData} title="Refresh data">
              ↻ Refresh
            </button>
            <button className="primary" onClick={() => setShowAddModal(true)}>
              ＋ New Item
            </button>
          </div>
        </header>

        {error && (
          <div className="alert">
            <span>⚠</span>
            <div>
              <strong>Backend connection issue:</strong> {error}. Ensure PostgreSQL and FastAPI backend are running on port 8000.
            </div>
          </div>
        )}

        {/* KPI Stat Cards */}
        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon total">📦</div>
            <div className="stat-info">
              <small>Total SKUs</small>
              <strong>{stats.total_items}</strong>
              <span>Active inventory items</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon in-stock">✓</div>
            <div className="stat-info">
              <small>In Stock</small>
              <strong>{stats.in_stock}</strong>
              <span>Healthy reserve levels</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon low-stock">⚠</div>
            <div className="stat-info">
              <small>Low Stock Alerts</small>
              <strong>{stats.low_stock}</strong>
              <span>Below minimum threshold</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon out-stock">✕</div>
            <div className="stat-info">
              <small>Out of Stock</small>
              <strong>{stats.out_of_stock}</strong>
              <span>Requires immediate restock</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon value">$</div>
            <div className="stat-info">
              <small>Total Valuation</small>
              <strong>${Number(stats.total_valuation || 0).toLocaleString()}</strong>
              <span>Current asset holding</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="content-grid">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Inventory Ledger</h2>
                <p className="muted">Filter and manage SKUs across warehouse aisles.</p>
              </div>

              {/* Status Pills */}
              <div className="filter-pills">
                {['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((st) => (
                  <button
                    key={st}
                    className={statusFilter === st ? 'selected' : ''}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st === 'ALL' ? 'All Status' : st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar with Search and Category Pills */}
            <div className="filters-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search SKU, item name, aisle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="filter-pills">
                {['ALL', 'Electronics', 'Hardware', 'Logistics', 'General'].map((cat) => (
                  <button
                    key={cat}
                    className={categoryFilter === cat ? 'selected' : ''}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Items Table */}
            {loading ? (
              <div className="empty">Loading inventory data...</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>SKU & Product</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Stock Qty</th>
                      <th>Unit Price</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="item-info">
                            <span className="sku-badge">{item.sku}</span>
                            <b style={{ marginTop: '4px' }}>{item.name}</b>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-muted)' }}>{item.category}</span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                            📍 {item.warehouse_location}
                          </span>
                        </td>
                        <td>
                          <div>
                            <strong>{item.quantity}</strong>{' '}
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                              / min {item.min_threshold}
                            </span>
                          </div>
                        </td>
                        <td>${Number(item.unit_price).toFixed(2)}</td>
                        <td>
                          <span className={`status-pill ${item.status.toLowerCase()}`}>
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="icon-btn"
                              title="Restock Item"
                              onClick={() => {
                                setRestockTarget(item);
                                setRestockAmount(10);
                              }}
                            >
                              ＋ Restock
                            </button>
                            <button
                              className="icon-btn danger"
                              title="Delete Item"
                              onClick={() => handleDeleteItem(item)}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredItems.length && (
                  <div className="empty">No inventory items match the current filters.</div>
                )}
              </div>
            )}
          </div>

          {/* Activity & Pipeline Sidebar */}
          <aside className="panel">
            <div className="panel-head">
              <div>
                <h2>Live Activity</h2>
                <p className="muted">Recent warehouse transactions.</p>
              </div>
            </div>

            <div className="activity-feed">
              {activities.map((act) => (
                <div key={act.id} className="activity-row">
                  <div className="activity-icon">{act.icon}</div>
                  <div>
                    <b>{act.text}</b>
                    <small>{act.time}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="pipeline">
              <span>Test</span>
              <i></i>
              <span>Build</span>
              <i></i>
              <span>Trivy</span>
              <i></i>
              <span>Deploy</span>
            </div>
          </aside>
        </section>

        {/* Modal: Add New Item */}
        {showAddModal && (
          <div className="modal-backdrop">
            <form className="modal" onSubmit={handleCreateItem}>
              <div className="modal-head">
                <div>
                  <p className="eyebrow">NEW ENTRY</p>
                  <h2>Add Inventory Item</h2>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="form-row">
                <label>
                  SKU Code *
                  <input name="sku" required placeholder="e.g. SKU-ELEC-101" />
                </label>
                <label>
                  Category
                  <select name="category" defaultValue="General">
                    <option value="Electronics">Electronics</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Logistics">Logistics</option>
                    <option value="General">General</option>
                  </select>
                </label>
              </div>

              <label>
                Product Name *
                <input name="name" required placeholder="e.g. Industrial Barcode Scanner" />
              </label>

              <div className="form-row">
                <label>
                  Initial Quantity *
                  <input name="quantity" type="number" min="0" defaultValue="20" required />
                </label>
                <label>
                  Min Alert Threshold *
                  <input name="min_threshold" type="number" min="1" defaultValue="5" required />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Unit Price ($) *
                  <input
                    name="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="49.99"
                    required
                  />
                </label>
                <label>
                  Warehouse Location *
                  <input name="warehouse_location" defaultValue="Aisle 1, Bin A" required />
                </label>
              </div>

              <button className="primary full" type="submit">
                Create Inventory Item
              </button>
            </form>
          </div>
        )}

        {/* Modal: Quick Restock */}
        {restockTarget && (
          <div className="modal-backdrop">
            <form className="modal" onSubmit={handleRestock}>
              <div className="modal-head">
                <div>
                  <p className="eyebrow">REPLENISHMENT</p>
                  <h2>Restock SKU: {restockTarget.sku}</h2>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setRestockTarget(null)}
                >
                  ×
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Product: <b>{restockTarget.name}</b> <br />
                Current Stock: <b>{restockTarget.quantity} units</b> (Alert Threshold:{' '}
                {restockTarget.min_threshold})
              </p>

              <label>
                Units to Add *
                <input
                  type="number"
                  min="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  required
                />
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="secondary"
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => setRestockAmount(amt)}
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <button className="primary full" type="submit">
                Confirm Restock
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
