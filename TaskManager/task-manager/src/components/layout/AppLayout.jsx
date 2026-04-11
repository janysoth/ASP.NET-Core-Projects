import Navbar from '../navigation/Navbar';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray 50">
      <Navbar />
      <main className='pt-4'>{children}</main>
    </div>
  );
};

export default AppLayout;