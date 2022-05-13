import Navbar from "../navigation/navbar";

export default function Layout(props: any) {
    return (
        <>
            <Navbar />
            {props.children}
        </>
    )
}