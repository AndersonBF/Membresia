const Announcements = () => {
  return (
    <div className="bg-white p-4 rounded-md">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold my-4">Announcements</h1>
            <span className="text-xs text-gray-400">View All</span>
            
        </div>
        <div className="flex flex-col gap-4 mt-4">
        <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
            <h2>Lorem Ipsum dolor sit</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md py1">
                2026-01-01
            </span>
        </div>
        <p className=" text-gray-400 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. </p>
        </div>
    </div>
    <div className="flex flex-col gap-4 mt-4">
        <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
            <h2>Lorem Ipsum dolor sit</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md py1">
                2026-01-01
            </span>
        </div>
        <p className=" text-gray-400 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. </p>
        </div>
    </div>
    <div className="flex flex-col gap-4 mt-4">
        <div className="bg-lamaPurpleLight rounded-md p-4">
            <div className="flex items-center justify-between">
            <h2>Lorem Ipsum dolor sit</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md py1">
                2026-01-01
            </span>
        </div>
        <p className=" text-gray-400 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. </p>
        </div>
    </div>
    </div>
  )
}

export default Announcements