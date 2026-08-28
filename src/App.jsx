import { Suspense, lazy, Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Ask from './pages/Ask';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import { Orders, OrderDetail } from './pages/Orders';
import { Faq, Wishlist, NotFound } from './pages/Static';
import { ADMIN_PATH } from './lib/routes';
import { Loader, ErrorState } from './components/States';

// The panel is only for the owner — visitors shouldn't download it.
const Admin = lazy(() => import('./admin/Admin'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const Catalog = lazy(() => import('./admin/Catalog').then((m) => ({ default: m.Catalog })));
const AdminOrders = lazy(() => import('./admin/Orders'));
const Stock = lazy(() => import('./admin/Stock'));

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="wrap">
          <ErrorState
            message="این صفحه بالا نیامد."
            onRetry={() => this.setState({ error: null })}
          />
        </div>
      );
    return this.props.children;
  }
}

export default function App() {
  return (
    <Boundary>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="p/:slug" element={<Product />} />
            <Route path="cart" element={<Cart />} />
            <Route path="ask" element={<Ask />} />
            <Route path="faq" element={<Faq />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="enter" element={<Auth />} />
            <Route path="profile" element={<Profile />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path={ADMIN_PATH} element={<Admin />}>
            <Route index element={<Dashboard />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="stock" element={<Stock />} />
          </Route>
        </Routes>
      </Suspense>
    </Boundary>
  );
}
