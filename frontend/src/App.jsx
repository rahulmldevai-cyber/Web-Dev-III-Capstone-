
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  UserRound,
  LogIn,
  LogOut,
  ShoppingCart,
  Package,
  LayoutDashboard,
  Truck,
  ShieldCheck,
  Star,
  RotateCcw,
  ShoppingBag,
  LockKeyhole,
  Minus,
  Plus,
  Trash2,
  X,
  CreditCard,
  ClipboardList,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

import SellerDashboard from './SellerDashboard'
import './App.css'

const API_URL = 'http://localhost:5000/api'

const PRODUCT_IMAGES = {
  'Kitchen Mixer':
    'https://www.wonderchef.com/cdn/shop/articles/Coconut_Chutney_in_Mixer_Grinder.png?v=1785390919&width=1000',

  'Cotton T-Shirt':
    'https://assets.ajio.com/medias/sys_master/root1/20251121/5bAX/69201889a470c5082fa48bcc/-473Wx593H-469762977-opticwhiteth-MODEL.jpg',

  'Laptop Backpack':
    'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/NI_CATALOG/IMAGES/CIW/2026/9/28/edbd500e-86d7-4186-b9ea-01cf7518a0b1_164580.png',

  'Smart Watch':
    'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/watch-card-50-os-202609_GEO_IN_FMT_WHH?wid=618&hei=900&fmt=p-jpg&qlt=80&.v=WEZYMGJIZEgxOTRnU2tod2ZmZU5IdDlBUnZ6Y215Yk9QTUlVNk9nWWU2OFF3eDAvMU0yZlhDRGJWV09PTFo2Z2pSVlk1OXNZTUhiKzM1M0c4ZTd3Z25mdXpCd1N1RkQvWHc3MlpHdVhUcW05Y1pEQ2xqVFI3Vkxja3FkOWZGQ20&traceId=1',

  'Wireless Headphones':
    'https://m.media-amazon.com/images/I/81M31hLf2NL._AC_UF1000,1000_QL80_.jpg',

  'Gaming Laptop':
    'https://www.yankodesign.com/images/design_news/2025/01/lenovo-legion-unleashes-next-gen-gaming-power-at-ces-2025/lenovo-ces-2025-legion-pro-7i-03.jpg'
}

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortOrder, setSortOrder] = useState('default')

  const [selectedProduct, setSelectedProduct] = useState(null)

  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const [deliveryDetails, setDeliveryDetails] = useState({
    recipientName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  })

  const [placedOrder, setPlacedOrder] = useState(null)
  const [showOrderSuccess, setShowOrderSuccess] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')

  const [showOrders, setShowOrders] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [cancellingOrderId, setCancellingOrderId] = useState('')

  const [showSellerDashboard, setShowSellerDashboard] = useState(false)

  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const [accessToken, setAccessToken] = useState('')

  const [refreshToken, setRefreshToken] = useState(
    () => sessionStorage.getItem('refreshToken') || ''
  )

  const [showAuth, setShowAuth] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  const applyCart = (cartData) => {
    setCart(
      (cartData?.items || []).map((item) => ({
        ...item.product,
        quantity: item.quantity,
        cartItemId: item._id,
        subtotal: item.subtotal
      }))
    )
  }

  const syncCart = async (token) => {
    const response = await fetch(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to load cart')
    }

    applyCart(data.cart)
  }

  const refreshProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to refresh products')
      }

      setProducts(data.products || [])
    } catch (err) {
      console.error('Product refresh error:', err)
    }
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to load products')
        }

        setProducts(data.products || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const restoreSession = async () => {
      if (!refreshToken) return

      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Session expired')
        }

        setAccessToken(data.accessToken)
        setRefreshToken(data.refreshToken)

        sessionStorage.setItem('refreshToken', data.refreshToken)

        try {
          await syncCart(data.accessToken)
        } catch (cartError) {
          console.error('Cart loading error:', cartError)
        }
      } catch (err) {
        console.error('Session restore error:', err)

        sessionStorage.removeItem('refreshToken')
        sessionStorage.removeItem('user')

        setRefreshToken('')
        setUser(null)
        setAccessToken('')
        setCart([])
      }
    }

    restoreSession()
  }, [])

  const categories = useMemo(() => [
    'All',
    ...new Set(
      products.map((product) => product.category?.name).filter(Boolean)
    )
  ], [products])

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesCategory =
        category === 'All' || product.category?.name === category

      return matchesSearch && matchesCategory
    })

    if (sortOrder === 'low-high') {
      filtered.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortOrder === 'high-low') {
      filtered.sort((a, b) => Number(b.price) - Number(a.price))
    }

    return filtered
  }, [products, search, category, sortOrder])

  const addToCart = async (product) => {
    if (!user || !accessToken) {
      setShowAuth(true)
      setIsRegister(false)
      setAuthError('Please login before adding products to your cart.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to add product')
      }

      applyCart(data.cart)
    } catch (err) {
      alert(err.message)
    }
  }

  const updateCartQuantity = async (item, quantity) => {
    if (!accessToken) return

    if (quantity < 1) {
      await removeCartItem(item.cartItemId)
      return
    }

    if (quantity > item.stock) {
      alert(`Only ${item.stock} units are available.`)
      return
    }

    try {
      const response = await fetch(`${API_URL}/cart/${item.cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ quantity })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update quantity')
      }

      applyCart(data.cart)
    } catch (err) {
      alert(err.message)
    }
  }

  const removeCartItem = async (itemId) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_URL}/cart/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to remove product')
      }

      applyCart(data.cart)
    } catch (err) {
      alert(err.message)
    }
  }

  const clearCart = async () => {
    if (!accessToken || cart.length === 0) return

    if (!window.confirm('Are you sure you want to clear your cart?')) return

    try {
      const response = await fetch(`${API_URL}/cart/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to clear cart')
      }

      applyCart(data.cart)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCheckout = () => {
    if (!user || !accessToken) {
      setShowCart(false)
      setShowAuth(true)
      setIsRegister(false)
      setAuthError('Please login before checkout.')
      return
    }

    if (cart.length === 0) return

    setDeliveryDetails((previous) => ({
      ...previous,
      recipientName: previous.recipientName || user.name || ''
    }))

    setCheckoutError('')
    setShowCart(false)
    setShowCheckout(true)
  }

  const handlePlaceOrder = async (event) => {
    event.preventDefault()

    if (!accessToken || cart.length === 0) {
      setCheckoutError('Your cart is empty or your session has expired.')
      return
    }

    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ deliveryDetails })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to place order')
      }

      setPlacedOrder(data.order)
      setPaymentError('')
      setPaymentMessage('')
      setShowCheckout(false)
      setShowOrderSuccess(true)

      try {
        await syncCart(accessToken)
      } catch (cartError) {
        console.error('Cart refresh error:', cartError)
        setCart([])
      }

      await refreshProducts()
    } catch (err) {
      setCheckoutError(err.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleSimulatedPayment = async () => {
    if (!placedOrder?._id || !accessToken) return

    setPaymentLoading(true)
    setPaymentError('')
    setPaymentMessage('')

    try {
      const response = await fetch(
        `${API_URL}/orders/${placedOrder._id}/pay`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Payment could not be processed')
      }

      setPlacedOrder((previous) => ({
        ...previous,
        paymentStatus: data.payment?.paymentStatus || 'paid'
      }))

      setPaymentMessage(data.message || 'Simulated payment successful.')
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleAuth = async (event) => {
    event.preventDefault()

    setAuthLoading(true)
    setAuthError('')
    setAuthSuccess('')

    const endpoint = isRegister ? 'register' : 'login'

    try {
      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRegister
            ? form
            : { email: form.email, password: form.password }
        )
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed')
      }

      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setUser(data.user)

      sessionStorage.setItem('refreshToken', data.refreshToken)
      sessionStorage.setItem('user', JSON.stringify(data.user))

      try {
        await syncCart(data.accessToken)
      } catch (cartError) {
        console.error('Cart loading error:', cartError)
      }

      setAuthSuccess(data.message)
      setForm({ name: '', email: '', password: '' })

      setTimeout(() => {
        setShowAuth(false)
        setAuthSuccess('')
        setAuthError('')
      }, 700)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const fetchMyOrders = async () => {
    if (!accessToken) return

    setOrdersLoading(true)
    setOrdersError('')

    try {
      const response = await fetch(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load your orders')
      }

      setOrders(data.orders || [])
    } catch (err) {
      setOrdersError(err.message)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleOpenOrders = async () => {
    if (!user || !accessToken) {
      setShowAuth(true)
      setIsRegister(false)
      setAuthError('Please login to view your orders.')
      return
    }

    setShowOrders(true)
    await fetchMyOrders()
  }

  const handleCancelOrder = async (orderId) => {
    if (
      !accessToken ||
      !window.confirm('Are you sure you want to cancel this order?')
    ) {
      return
    }

    setCancellingOrderId(orderId)
    setOrdersError('')

    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/cancel`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to cancel this order')
      }

      await fetchMyOrders()
    } catch (err) {
      setOrdersError(err.message)
    } finally {
      setCancellingOrderId('')
    }
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    }

    setUser(null)
    setAccessToken('')
    setRefreshToken('')
    setCart([])
    setShowCart(false)
    setShowOrders(false)
    setShowSellerDashboard(false)

    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('user')
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  )

  return (
    <div className="app">
      <div className="top-bar">
        <Truck size={15} />
        <span>Free delivery on orders above ₹999</span>
      </div>

      <header className="navbar">
        <a
          className="brand"
          href="#"
          onClick={() => setShowSellerDashboard(false)}
        >
          <span className="brand-icon">
            <ShoppingBag size={22} />
          </span>
          Smart<span>Cart</span>
        </a>

        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-name">
                <UserRound size={17} />
                Hi, {user.name}
              </span>

              {user.role === 'customer' && (
                <button className="login-btn" onClick={handleOpenOrders}>
                  <Package size={17} />
                  My Orders
                </button>
              )}

              {['seller', 'admin'].includes(user.role) && (
                <button
                  className="login-btn"
                  disabled={!accessToken}
                  onClick={() => {
                    setShowCart(false)
                    setShowOrders(false)
                    setShowCheckout(false)
                    setShowSellerDashboard(true)
                  }}
                >
                  <LayoutDashboard size={17} />
                  {showSellerDashboard ? 'Dashboard Open' : 'Seller Dashboard'}
                </button>
              )}

              <button className="login-btn" onClick={handleLogout}>
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <button
              className="login-btn"
              onClick={() => {
                setShowAuth(true)
                setIsRegister(false)
                setAuthError('')
              }}
            >
              <LogIn size={17} />
              Login
            </button>
          )}

          <button
            className="cart-btn"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart size={21} />
            Cart
            <span>{cartCount}</span>
          </button>
        </div>
      </header>

      {showSellerDashboard ? (
        <SellerDashboard
          accessToken={accessToken}
          catalogProducts={products}
          onBack={() => setShowSellerDashboard(false)}
          onProductsChanged={refreshProducts}
        />
      ) : (
        <>
          <main>
            <section className="hero">
              <div className="hero-content">
                <span className="hero-tag">
                  SMART SHOPPING STARTS HERE
                </span>

                <h1>
                  Everything you need.<br />
                  <span>All in one place.</span>
                </h1>

                <p>
                  Discover quality products at great prices.
                  Shop smarter with SmartCart.
                </p>

                <a href="#products" className="hero-btn">
                  Explore Products <ArrowRight size={18} />
                </a>
              </div>

              <div className="hero-art">
                <div className="hero-circle"></div>
                <div className="hero-emoji">
                  <ShoppingBag size={100} strokeWidth={1.2} />
                </div>
                <div className="floating-card">
                  <Star size={17} />
                  Great deals, every day
                </div>
              </div>
            </section>

            <section className="features">
              <div>
                <Truck size={30} />
                <div>
                  <b>Fast Delivery</b>
                  <small>Quick & reliable</small>
                </div>
              </div>

              <div>
                <ShieldCheck size={30} />
                <div>
                  <b>Secure Shopping</b>
                  <small>Safe transactions</small>
                </div>
              </div>

              <div>
                <Star size={30} />
                <div>
                  <b>Quality Products</b>
                  <small>Carefully selected</small>
                </div>
              </div>

              <div>
                <RotateCcw size={30} />
                <div>
                  <b>Easy Returns</b>
                  <small>Hassle-free support</small>
                </div>
              </div>
            </section>

            <section className="products-section" id="products">
              <div className="section-heading">
                <div>
                  <span className="section-tag">OUR COLLECTION</span>
                  <h2>Explore Products</h2>
                  <p>Find the right products for your everyday needs.</p>
                </div>

                <span className="product-count">
                  {products.length} Products
                </span>
              </div>

              <div className="category-list">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={
                      category === item ? 'category active' : 'category'
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="product-toolbar">
                <span>{filteredProducts.length} products found</span>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  aria-label="Sort products by price"
                >
                  <option value="default">Recommended</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                </select>
              </div>

              {loading && (
                <div className="message">Loading products...</div>
              )}

              {error && (
                <div className="message error">
                  {error}
                  <p>Make sure your backend server is running.</p>
                </div>
              )}

              {!loading && !error && filteredProducts.length === 0 && (
                <div className="message">No products found.</div>
              )}

              {!loading && !error && (
                <div className="product-grid">
                  {filteredProducts.map((product) => {
                    const imageUrl =
                      PRODUCT_IMAGES[product.name] ||
                      product.image?.trim() ||
                      ''

                    return (
                      <article className="product-card" key={product._id}>
                        <div
                          className="product-image clickable-product"
                          onClick={() => setSelectedProduct(product)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedProduct(product)
                            }
                          }}
                        >
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling.style.display = 'flex'
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                objectPosition: 'center',
                                padding: '12px'
                              }}
                            />
                          )}

                          <span
                            className="product-emoji"
                            style={{
                              display: imageUrl ? 'none' : 'flex'
                            }}
                          >
                            {product.category?.name === 'Electronics' ? (
                              <Package size={48} />
                            ) : product.category?.name === 'Clothing' ? (
                              <ShoppingBag size={48} />
                            ) : (
                              <Package size={48} />
                            )}
                          </span>

                          <span
                            className={
                              product.stock > 0
                                ? 'stock available'
                                : 'stock unavailable'
                            }
                          >
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        <div className="product-info">
                          <span className="product-category">
                            {product.category?.name || 'General'}
                          </span>

                          <h3
                            className="clickable-product-name"
                            onClick={() => setSelectedProduct(product)}
                          >
                            {product.name}
                          </h3>

                          <p>{product.description}</p>

                          <div className="product-bottom">
                            <strong>
                              ₹{Number(product.price).toLocaleString('en-IN')}
                            </strong>

                            <button
                              disabled={product.stock < 1}
                              onClick={() => addToCart(product)}
                            >
                              {product.stock > 0 ? (
                                <>
                                  <ShoppingCart size={16} />
                                  Add +
                                </>
                              ) : (
                                'Sold Out'
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </main>

          <footer>
            <a className="brand footer-brand" href="#">
              <span className="brand-icon">
                <ShoppingBag size={20} />
              </span>
              Smart<span>Cart</span>
            </a>

            <p>© 2026 SmartCart. Built for smarter shopping.</p>
          </footer>
        </>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div
          className="product-details-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className="product-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="product-details-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close product details"
            >
              <X size={22} />
            </button>

            <div className="product-details-image">
              {(
                PRODUCT_IMAGES[selectedProduct.name] ||
                selectedProduct.image?.trim()
              ) ? (
                <img
                  src={
                    PRODUCT_IMAGES[selectedProduct.name] ||
                    selectedProduct.image?.trim()
                  }
                  alt={selectedProduct.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling.style.display = 'flex'
                  }}
                />
              ) : null}

              <div
                className="product-details-fallback"
                style={{
                  display:
                    PRODUCT_IMAGES[selectedProduct.name] ||
                    selectedProduct.image?.trim()
                      ? 'none'
                      : 'flex'
                }}
              >
                <Package size={65} />
              </div>
            </div>

            <div className="product-details-info">
              <span className="product-category">
                {selectedProduct.category?.name || 'General'}
              </span>

              <h2>{selectedProduct.name}</h2>

              <p className="product-details-description">
                {selectedProduct.description || 'No description available.'}
              </p>

              <strong className="product-details-price">
                ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
              </strong>

              <div
                className={
                  selectedProduct.stock > 0
                    ? 'product-details-stock available'
                    : 'product-details-stock unavailable'
                }
              >
                {selectedProduct.stock > 0
                  ? `In Stock (${selectedProduct.stock} available)`
                  : 'Currently Out of Stock'}
              </div>

              <button
                className="product-details-cart-btn"
                disabled={selectedProduct.stock < 1}
                onClick={() => addToCart(selectedProduct)}
              >
                <ShoppingCart size={19} />
                {selectedProduct.stock > 0 ? 'Add to Cart' : 'Sold Out'}
              </button>

              <div className="product-details-benefits">
                <span><Truck size={17} /> Fast Delivery</span>
                <span><ShieldCheck size={17} /> Secure Shopping</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {showCart && (
        <div
          className="cart-overlay"
          onClick={() => setShowCart(false)}
        >
          <aside
            className="cart-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cart-drawer-header">
              <div>
                <span className="section-tag">YOUR SHOPPING</span>
                <h2>Shopping Cart ({cartCount})</h2>
              </div>

              <button
                className="cart-close"
                onClick={() => setShowCart(false)}
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>

            {!user ? (
              <div className="cart-empty">
                <LockKeyhole size={42} />
                <h3>Login to view your cart</h3>
                <p>Your saved cart items will appear here after login.</p>

                <button
                  onClick={() => {
                    setShowCart(false)
                    setShowAuth(true)
                    setIsRegister(false)
                    setAuthError('')
                  }}
                >
                  Login
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingCart size={45} />
                <h3>Your cart is empty</h3>
                <p>Explore products and add something you like.</p>
                <button onClick={() => setShowCart(false)}>
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.cartItemId}>
                      <div className="cart-item-icon">
                        <ShoppingBag size={28} />
                      </div>

                      <div className="cart-item-details">
                        <h3>{item.name}</h3>
                        <p>
                          ₹{Number(item.price).toLocaleString('en-IN')} each
                        </p>

                        <div className="quantity-controls">
                          <button
                            onClick={() =>
                              updateCartQuantity(item, item.quantity - 1)
                            }
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus size={14} />
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            onClick={() =>
                              updateCartQuantity(item, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-end">
                        <strong>
                          ₹{(
                            Number(item.price) * item.quantity
                          ).toLocaleString('en-IN')}
                        </strong>

                        <button
                          className="remove-item"
                          onClick={() => removeCartItem(item.cartItemId)}
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <button className="clear-cart-btn" onClick={clearCart}>
                    <Trash2 size={15} />
                    Clear Cart
                  </button>

                  <div className="cart-total-row">
                    <span>Total Amount</span>
                    <strong>₹{cartTotal.toLocaleString('en-IN')}</strong>
                  </div>

                  <button
                    className="checkout-btn"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                    <ArrowRight size={18} />
                  </button>

                  <p>
                    Taxes and delivery charges are calculated at checkout.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {showCheckout && (
        <div
          className="checkout-overlay"
          onClick={() => setShowCheckout(false)}
        >
          <section
            className="checkout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="checkout-close"
              type="button"
              onClick={() => setShowCheckout(false)}
              aria-label="Close checkout"
            >
              <X size={21} />
            </button>

            <span className="section-tag">SECURE CHECKOUT</span>
            <h2>Delivery Details</h2>

            <p className="checkout-subtitle">
              Enter the address where you want your order delivered.
            </p>

            <div className="checkout-order-summary">
              <div>
                <span>Items ({cartCount})</span>
                <strong>₹{cartTotal.toLocaleString('en-IN')}</strong>
              </div>

              <small>
                Final amount is calculated by the server when your order is placed.
              </small>
            </div>

            <form className="checkout-form" onSubmit={handlePlaceOrder}>
              <label>
                Recipient Name
                <input
                  type="text"
                  value={deliveryDetails.recipientName}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      recipientName: e.target.value
                    })
                  }
                  required
                  maxLength={100}
                  placeholder="Full name"
                />
              </label>

              <label>
                Phone Number
                <input
                  type="tel"
                  value={deliveryDetails.phone}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      phone: e.target.value.replace(/\D/g, '').slice(0, 10)
                    })
                  }
                  required
                  pattern="[0-9]{10}"
                  title="Enter a 10-digit phone number"
                  placeholder="10-digit mobile number"
                />
              </label>

              <label className="checkout-full-width">
                Address
                <textarea
                  value={deliveryDetails.addressLine}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      addressLine: e.target.value
                    })
                  }
                  required
                  maxLength={250}
                  rows={3}
                  placeholder="House number, street, area"
                />
              </label>

              <label>
                City
                <input
                  type="text"
                  value={deliveryDetails.city}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      city: e.target.value
                    })
                  }
                  required
                  placeholder="City"
                />
              </label>

              <label>
                State
                <input
                  type="text"
                  value={deliveryDetails.state}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      state: e.target.value
                    })
                  }
                  required
                  placeholder="State"
                />
              </label>

              <label>
                PIN Code
                <input
                  type="text"
                  inputMode="numeric"
                  value={deliveryDetails.postalCode}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      postalCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                    })
                  }
                  required
                  pattern="[0-9]{6}"
                  title="Enter a 6-digit PIN code"
                  placeholder="6-digit PIN code"
                />
              </label>

              <label>
                Country
                <input
                  type="text"
                  value={deliveryDetails.country}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      country: e.target.value
                    })
                  }
                  required
                  placeholder="Country"
                />
              </label>

              {checkoutError && (
                <p className="checkout-error">{checkoutError}</p>
              )}

              <button
                className="checkout-place-btn"
                type="submit"
                disabled={checkoutLoading || cart.length === 0}
              >
                {checkoutLoading
                  ? 'Placing Order...'
                  : `Place Order · ₹${cartTotal.toLocaleString('en-IN')}`}
              </button>
            </form>
          </section>
        </div>
      )}

      {showOrderSuccess && placedOrder && (
        <div
          className="checkout-overlay"
          onClick={() => setShowOrderSuccess(false)}
        >
          <section
            className="order-success-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="checkout-close"
              type="button"
              onClick={() => setShowOrderSuccess(false)}
              aria-label="Close order confirmation"
            >
              <X size={21} />
            </button>

            <div className="order-success-icon">
              <CheckCircle2 size={45} />
            </div>

            <span className="section-tag">ORDER CONFIRMED</span>
            <h2>Your order has been placed!</h2>

            <p className="checkout-subtitle">
              Your cart has been cleared and inventory has been updated.
            </p>

            <div className="order-confirmation-details">
              <div>
                <span>Order ID</span>
                <strong>{placedOrder._id}</strong>
              </div>

              <div>
                <span>Order Amount</span>
                <strong>
                  ₹{Number(placedOrder.totalAmount).toLocaleString('en-IN')}
                </strong>
              </div>

              <div>
                <span>Order Status</span>
                <strong>{placedOrder.status}</strong>
              </div>

              <div>
                <span>Payment Status</span>
                <strong>{placedOrder.paymentStatus}</strong>
              </div>
            </div>

            {paymentMessage && (
              <p className="payment-success">{paymentMessage}</p>
            )}

            {paymentError && (
              <p className="checkout-error">{paymentError}</p>
            )}

            {placedOrder.paymentStatus === 'paid' ? (
              <>
                <button
                  type="button"
                  className="checkout-place-btn"
                  onClick={() => setShowOrderSuccess(false)}
                >
                  Continue Shopping
                </button>

                <button
                  type="button"
                  className="continue-shopping-btn"
                  onClick={() => {
                    setShowOrderSuccess(false)
                    handleOpenOrders()
                  }}
                >
                  View My Orders
                </button>
              </>
            ) : (
              <>
                <button
                  className="checkout-place-btn"
                  onClick={handleSimulatedPayment}
                  disabled={paymentLoading}
                >
                  <CreditCard size={18} />
                  {paymentLoading ? 'Processing...' : 'Pay Now (Simulated)'}
                </button>

                <p className="payment-note">
                  Demo payment only. No real money will be charged.
                </p>

                <button
                  className="continue-shopping-btn"
                  onClick={() => setShowOrderSuccess(false)}
                >
                  Pay Later · Continue Shopping
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {showOrders && (
        <div
          className="checkout-overlay orders-overlay"
          onClick={() => setShowOrders(false)}
        >
          <section
            className="orders-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="checkout-close"
              onClick={() => setShowOrders(false)}
              aria-label="Close orders"
            >
              <X size={21} />
            </button>

            <span className="section-tag">YOUR ACCOUNT</span>
            <h2>My Orders</h2>

            <p className="checkout-subtitle">
              Track your purchases and manage pending orders.
            </p>

            {ordersError && (
              <p className="checkout-error">{ordersError}</p>
            )}

            {ordersLoading ? (
              <p className="orders-message">Loading your orders...</p>
            ) : orders.length === 0 ? (
              <div className="orders-empty">
                <ClipboardList size={42} />
                <h3>No orders yet</h3>
                <p>Your placed orders will appear here.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <article className="order-card" key={order._id}>
                    <div className="order-card-heading">
                      <div>
                        <span>ORDER ID</span>
                        <strong>{order._id}</strong>
                      </div>

                      <span
                        className={`order-status status-${String(
                          order.status || ''
                        ).toLowerCase()}`}
                      >
                        {order.status || 'unknown'}
                      </span>
                    </div>

                    <div className="order-card-meta">
                      <span>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-IN')
                          : 'Date unavailable'}
                      </span>

                      <strong>
                        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="order-product-list">
                      {(order.products || []).map((item, index) => (
                        <div
                          className="order-product-row"
                          key={item._id || item.product?._id || index}
                        >
                          <span>
                            {item.product?.name || 'Product'} × {item.quantity}
                          </span>

                          <span>
                            ₹{(
                              Number(item.price || 0) *
                              Number(item.quantity || 0)
                            ).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-payment-row">
                      <span>
                        Payment: <strong>{order.paymentStatus || 'pending'}</strong>
                      </span>

                      {order.status === 'pending' && (
                        <button
                          className="cancel-order-btn"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingOrderId === order._id}
                        >
                          {cancellingOrderId === order._id
                            ? 'Cancelling...'
                            : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <button
              className="checkout-place-btn orders-done-btn"
              onClick={() => setShowOrders(false)}
            >
              Close
            </button>
          </section>
        </div>
      )}

      {showAuth && (
        <div
          className="modal-overlay"
          onClick={() => setShowAuth(false)}
        >
          <div
            className="auth-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowAuth(false)}
              aria-label="Close login"
            >
              <X size={21} />
            </button>

            <span className="section-tag">WELCOME TO SMARTCART</span>

            <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>

            <p className="auth-subtitle">
              {isRegister
                ? 'Create your customer account.'
                : 'Login to continue shopping.'}
            </p>

            <form onSubmit={handleAuth}>
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />

              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                minLength={8}
                required
              />

              {authError && <p className="auth-error">{authError}</p>}
              {authSuccess && <p className="auth-success">{authSuccess}</p>}

              <button className="auth-submit" disabled={authLoading}>
                {authLoading
                  ? 'Please wait...'
                  : isRegister
                    ? 'Create Account'
                    : 'Login'}
              </button>
            </form>

            <p className="auth-switch">
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account?"}

              <button
                onClick={() => {
                  setIsRegister(!isRegister)
                  setAuthError('')
                  setAuthSuccess('')
                  setForm({ name: '', email: '', password: '' })
                }}
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
