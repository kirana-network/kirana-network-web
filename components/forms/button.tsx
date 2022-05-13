import tw from "tailwind-styled-components";

export default tw.button`
    inline-block px-6 py-2.5 text-white
    font-medium text-xs leading-tight uppercase rounded shadow-md
    transition duration-150 ease-in-out 
    ${(props: any) => props.disabled ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"}
    ${(props: any) => props.disabled ? "" : "focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0"}
    ${(props: any) => props.disabled ? "" : "active:bg-blue-800 active:shadow-lg"}
    `;
