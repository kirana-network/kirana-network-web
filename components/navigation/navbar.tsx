export default function Navbar(props: any) {
    return (
        <nav className="relative w-full flex flex-wrap items-center justify-between py-3 bg-gray-100 text-gray-500 hover:text-gray-700 focus:text-gray-700 shadow-lg">
            <div className="container-fluid w-full flex flex-wrap items-center justify-between px-6">
                <div className="container-fluid">
                    <a className="text-xl text-black" href="/">{process.env.APP_NAME}</a>
                    {/* <a className="nav-link text-gray-500 hover:text-gray-700 focus:text-gray-700 px-1" href="#">Team</a>
                    <a className="nav-link text-gray-500 hover:text-gray-700 focus:text-gray-700 px-1" href="#">Projects</a> */}
                </div>
                <a className="nav-link text-gray-500 hover:text-gray-700 focus:text-gray-700 px-1 pl-5" href="/track">Track</a>
            </div>
        </nav>
    );
}