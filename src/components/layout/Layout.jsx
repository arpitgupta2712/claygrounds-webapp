import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import ScrollToTop from '../common/ScrollToTop';
import { ErrorDisplay } from '../../hooks/useErrorTracker';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Layout component that provides consistent layout structure for all pages
 */
function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Error display */}
      <ErrorDisplay />
      
      {/* Toast notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {/* Navigation */}
      <NavBar />
      
      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  );
}

export default Layout; 