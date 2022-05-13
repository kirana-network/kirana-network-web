import Button from "./button";

type PrimaryButtonProps = {
    onClick: () => void,
    label: string,
    disabled: boolean,
};
export default function PrimaryButton({ onClick, label, disabled}: PrimaryButtonProps) {
    return (
        <Button onClick={onClick} label={label} disabled={disabled} />
    )
}