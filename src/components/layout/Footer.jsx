/**
 * Footer component
 */
function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              &copy; {year} ClayGrounds by Plaza. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-4">
            <a href="/terms" className="text-gray-600 hover:text-primary text-sm">Terms of Service</a>
            <a href="/privacy" className="text-gray-600 hover:text-primary text-sm">Privacy Policy</a>
            <a href="/help" className="text-gray-600 hover:text-primary text-sm">Help Center</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 