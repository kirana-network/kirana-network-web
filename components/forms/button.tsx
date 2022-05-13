type ButtonProps = {
    onClick: () => void,
    label: string,
    disabled: boolean,
}
export default function Button({ onClick, label, disabled }: ButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                inline-block 
                px-6 py-2.5 
                ${disabled ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"}
                text-white 
                font-medium text-xs leading-tight uppercase rounded shadow-md 
                ${disabled ? "" : "focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0"}
                ${disabled ? "" : "active:bg-blue-800 active:shadow-lg"}
                transition duration-150 ease-in-out
            `}
        >
            {label}
        </button>
    )
}