const Loading = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner animado */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-lamaSky rounded-full animate-spin"></div>
        </div>
        
        {/* Texto */}
        <p className="text-gray-600 text-sm font-medium">Carregando...</p>
      </div>
    </div>
  );
};

export default Loading;