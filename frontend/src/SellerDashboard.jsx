
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Boxes,
  IndianRupee,
  ShoppingCart,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle,
  Truck,
  CheckCircle2,
  Clock,
  Image as ImageIcon
} from 'lucide-react'

import './seller-dashboard.css'

const API_URL = 'http://localhost:5000/api'

function SellerDashboard({ accessToken, onBack, onProductsChanged }) {
  const [products, setProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingOrderId, setSavingOrderId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [imagePreviewError, setImagePreviewError] = useState(false)

  const emptyForm = {
    name: '',
    description: '',
    price: '',
    stock: '',
    lowStockThreshold: '5',
    category: '',
    image: ''
  }

  const [form, setForm] = useState(emptyForm)

  const request = async (url, options = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Request failed')
    }

    return data
  }

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const [inventoryData, lowStockData, ordersData] = await Promise.all([
        request('/inventory?page=1&limit=100'),
        request('/inventory/low-stock'),
        request('/orders/seller-orders')
      ])

      setProducts(inventoryData.products || [])
      setLowStock(lowStockData.products || [])
      setOrders(ordersData.orders || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setImagePreviewError(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        category: form.category,
        image: form.image.trim()
      }

      if (
        !payload.name ||
        !payload.description ||
        !payload.category ||
        !Number.isFinite(payload.price) ||
        payload.price < 0 ||
        !Number.isSafeInteger(payload.stock) ||
        payload.stock < 0 ||
        !Number.isSafeInteger(payload.lowStockThreshold) ||
        payload.lowStockThreshold < 0
      ) {
        throw new Error('Please enter valid product details.')
      }

      if (editingId) {
        await request(`/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        setMessage('Product updated successfully.')
      } else {
        await request('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        setMessage('Product added successfully.')
      }

      resetForm()
      await loadDashboard()
      onProductsChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product._id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? 0),
      lowStockThreshold: String(product.lowStockThreshold ?? 5),
      category: product.category?._id || product.category || '',
      image: product.image || ''
    })
    setImagePreviewError(false)
    setShowForm(true)
    setError('')
    setMessage('')
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return
    }

    setError('')
    setMessage('')

    try {
      await request(`/products/${product._id}`, {
        method: 'DELETE'
      })

      setMessage('Product deleted successfully.')
      await loadDashboard()
      onProductsChanged?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleStockUpdate = async (product) => {
    const enteredStock = window.prompt(
      `Enter new stock for ${product.name}:`,
      String(product.stock)
    )

    if (enteredStock === null) return

    const stock = Number(enteredStock)

    if (!Number.isSafeInteger(stock) || stock < 0) {
      setError('Stock must be a non-negative whole number.')
      return
    }

    try {
      setError('')
      setMessage('')

      await request(`/inventory/${product._id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock })
      })

      setMessage('Stock updated successfully.')
      await loadDashboard()
      onProductsChanged?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleOrderStatusUpdate = async (order) => {
    const nextStatus = {
      pending: 'confirmed',
      confirmed: 'shipped',
      shipped: 'delivered'
    }[order.status]

    if (!nextStatus) return

    const confirmed = window.confirm(
      `Change order status from "${order.status}" to "${nextStatus}"?`
    )

    if (!confirmed) return

    if (!confirmed) return

    setSavingOrderId(order._id)
    setError('')
    setMessage('')

    try {
      const data = await request(`/orders/${order._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      })

      setOrders((previousOrders) =>
        previousOrders.map((item) =>
          item._id === order._id
            ? { ...item, status: data.order.status }
            : item
        )
      )

      setMessage(`Order status updated to ${nextStatus}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingOrderId(null)
    }
  }

  const categories = [
    ...new Map(
      products
        .filter((product) => product.category?._id && product.category?.name)
        .map((product) => [
          product.category._id,
          { id: product.category._id, name: product.category.name }
        ])
    ).values()
  ]

  const totalUnits = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  )

  const inventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.price || 0) * Number(product.stock || 0),
    0
  )

  const getNextStatus = (status) => {
    return {
      pending: 'confirmed',
      confirmed: 'shipped',
      shipped: 'delivered'
    }[status]
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={15} />,
      confirmed: <CheckCircle size={15} />,
      shipped: <Truck size={15} />,
      delivered: <CheckCircle2 size={15} />,
      cancelled: <AlertTriangle size={15} />
    }

    return icons[status] || <Package size={15} />
  }

  if (loading) {
    return (
      <section className="seller-dashboard">
        <p className="seller-message">
          <RefreshCw size={18} /> Loading seller dashboard...
        </p>
      </section>
    )
  }

  return (
    <section className="seller-dashboard">

      <div className="seller-heading">
        <div>
          <span className="section-tag">SELLER PANEL</span>
          <h1>Seller Dashboard</h1>
          <p>Manage your products, inventory and orders.</p>
        </div>

        <button className="seller-back-btn" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to Store
        </button>
      </div>

      {error && <p className="seller-alert seller-error">{error}</p>}
      {message && <p className="seller-alert seller-success">{message}</p>}

      <div className="seller-stats">

        <article>
          <Package size={25} color="#ff9900" />
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </article>

        <article>
          <AlertTriangle size={25} color="#e69b20" />
          <span>Low Stock Products</span>
          <strong>{lowStock.length}</strong>
        </article>

        <article>
          <Boxes size={25} color="#2563eb" />
          <span>Total Stock Units</span>
          <strong>{totalUnits}</strong>
        </article>

        <article>
          <IndianRupee size={25} color="#067d62" />
          <span>Inventory Value</span>
          <strong>₹{inventoryValue.toLocaleString('en-IN')}</strong>
        </article>

      </div>

      {/* Order Management */}

      <div className="seller-section-heading">
        <div>
          <h2>
            <ClipboardList size={22} />
            Order Management
          </h2>
          <p>View customer orders and update their delivery status.</p>
        </div>
      </div>

      <div className="seller-table-wrapper">
        <table className="seller-table">
          <thead>
            <tr>
              <th>Order Details</th>
              <th>Customer</th>
              <th>Products</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7">No orders found.</td>
              </tr>
            ) : (
              orders.map((order) => {
                const nextStatus = getNextStatus(order.status)

                return (
                  <tr key={order._id}>
                    <td>
                      <strong>#{order._id.slice(-8)}</strong>
                      <br />
                      <small>
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </small>
                    </td>

                    <td>
                      <strong>{order.customer?.name || 'Customer'}</strong>
                      <br />
                      <small>{order.customer?.email || '—'}</small>
                      <br />
                      <small>{order.deliveryDetails?.phone || '—'}</small>
                    </td>

                    <td>
                      {order.products?.map((item) => (
                        <div key={item._id}>
                          <strong>{item.product?.name || 'Product'}</strong>
                          <br />
                          <small>
                            Qty: {item.quantity} × ₹
                            {Number(item.price).toLocaleString('en-IN')}
                          </small>
                        </div>
                      ))}
                    </td>

                    <td>
                      <strong>
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td>{order.paymentStatus || '—'}</td>

                    <td>
                      <strong className={`seller-order-status ${order.status}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </strong>
                    </td>

                    <td>
                      {nextStatus ? (
                        <button
                          className="seller-primary-btn"
                          onClick={() => handleOrderStatusUpdate(order)}
                          disabled={savingOrderId === order._id}
                        >
                          {savingOrderId === order._id
                            ? 'Updating...'
                            : nextStatus === 'confirmed'
                              ? 'Confirm Order'
                              : nextStatus === 'shipped'
                                ? 'Mark Shipped'
                                : 'Mark Delivered'}
                        </button>
                      ) : (
                        <span>Completed</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Product Management */}

      <div className="seller-section-heading">
        <div>
          <h2>
            <ShoppingCart size={22} />
            Product Management
          </h2>
          <p>Add, edit and remove your products.</p>
        </div>

        <button
          className="seller-primary-btn"
          onClick={() => {
            resetForm()
            setError('')
            setMessage('')
            setShowForm(true)
          }}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {showForm && (
        <form className="seller-product-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>

          <label>
            Product Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={100}
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
              rows={3}
            />
          </label>

          <label>
            Product Image URL
            <input
              type="url"
              placeholder="https://example.com/product-image.jpg"
              value={form.image}
              onChange={(e) => {
                setForm({ ...form, image: e.target.value })
                setImagePreviewError(false)
              }}
            />
          </label>

          {form.image.trim() && (
            <div className="seller-image-preview">
              <span>
                <ImageIcon size={16} />
                Image Preview
              </span>

              {imagePreviewError ? (
                <p>Image could not be loaded. Please check the URL.</p>
              ) : (
                <img
                  src={form.image.trim()}
                  alt="Product preview"
                  onError={() => setImagePreviewError(true)}
                />
              )}
            </div>
          )}

          <div className="seller-form-grid">
            <label>
              Price (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </label>

            <label>
              Stock
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </label>

            <label>
              Low Stock Threshold
              <input
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm({ ...form, lowStockThreshold: e.target.value })
                }
                required
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                required
              >
                <option value="">Select Category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {categories.length === 0 && (
            <p className="seller-form-note">
              No categories are available. Add a category before creating a
              product.
            </p>
          )}

          <div className="seller-form-actions">
            <button
              className="seller-primary-btn"
              type="submit"
              disabled={saving || categories.length === 0}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Product'
                  : 'Save Product'}
            </button>

            <button
              className="seller-secondary-btn"
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="seller-table-wrapper">
        <table className="seller-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Threshold</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6">No products found.</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td>{product.category?.name || '—'}</td>
                  <td>₹{Number(product.price).toLocaleString('en-IN')}</td>
                  <td>{product.stock}</td>
                  <td>{product.lowStockThreshold ?? 5}</td>
                  <td>
                    <div className="seller-row-actions">
                      <button onClick={() => handleEdit(product)}>
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button onClick={() => handleStockUpdate(product)}>
                        <RefreshCw size={14} />
                        Stock
                      </button>

                      <button
                        className="seller-delete-btn"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Low Stock Alerts */}

      <div className="seller-section-heading seller-low-stock-heading">
        <div>
          <h2>
            <AlertTriangle size={22} />
            Low Stock Alerts
          </h2>
          <p>Products at or below their stock threshold.</p>
        </div>
      </div>

      {lowStock.length === 0 ? (
        <p className="seller-message">
          <CheckCircle2 size={18} />
          No low-stock products. Inventory looks good.
        </p>
      ) : (
        <div className="seller-low-stock-list">
          {lowStock.map((product) => (
            <article key={product._id}>
              <div>
                <strong>{product.name}</strong>
                <span>{product.category?.name || 'General'}</span>
              </div>

              <strong className="seller-stock-warning">
                <AlertTriangle size={16} />
                {product.stock} left
              </strong>
            </article>
          ))}
        </div>
      )}

    </section>
  )
}

export default SellerDashboard
