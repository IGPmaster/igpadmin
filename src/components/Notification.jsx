// src/components/Notification.jsx
export function Notification({ message, type = 'info' }) {
  if (!message) return null;

  const bgColor = {
    success: 'bg-green-50 border-green-500',
    error: 'bg-red-50 border-red-500',
    info: 'bg-blue-50 border-blue-500'
  }[type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  }[type];

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-md border ${bgColor} ${textColor} shadow-lg transition-all duration-500 ease-in-out`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}