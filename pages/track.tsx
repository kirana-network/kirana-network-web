import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Button from "../components/forms/button";
import Layout from "../components/layout/layout";
import LoadingChildren from "../components/layout/loadingChildren";
import { ListOfTripNotes, Trip, TripNote, TripsApi } from "../modules/fleetonroute";
import configuration from "../utils/configuration";

export default function TrackPage() {
    const router = useRouter();
    const { id } = router.query;
    const [trip, setTrip] = useState<Trip>();
    const [tripNotes, setTripNotes] = useState<ListOfTripNotes>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            new TripsApi(configuration)
                .listTripNotes(id as string)
                .then(setTripNotes)
                .then(() => setLoading(false))
                .catch(console.error);
            new TripsApi().retrieveProofOfDelivery(id as string)
                .then(console.log).catch((response) => {
                    console.log(response.status);
                    console.error(response);
                });
            new TripsApi(configuration)
                .retrieveTripStatus(id as string)
                .then(setTrip)
                .catch(console.error);
        }
        else {
            setLoading(false);
        }
    }, [id]);

    return (
        <>
            <LoadingChildren loading={loading}>
                {
                    trip && <TripDetails trip={trip} tripNotes={tripNotes} />
                }
                {
                    !trip && <><TripIdInput /></>
                }
            </LoadingChildren>
        </>
    );
}

type TripDetailsProps = {
    trip: Trip, tripNotes?: ListOfTripNotes
};

function TripDetails({ trip, tripNotes }: TripDetailsProps) {
    return (
        <>
            <div className="p-4">
                <h1 className="text-3xl">{trip?.address}</h1>
            </div>

            <div className="p-4">
                <ol className="border-l border-gray-300">
                    {
                        tripNotes?.records?.map(tn =>
                            <li key={tn.id}>
                                <div className="flex flex-start items-center pt-3">
                                    <div className="bg-gray-300 w-2 h-2 rounded-full -ml-1 mr-3"></div>
                                    <p className="text-gray-500 text-sm">{new Date(tn.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="mt-0.5 ml-4 mb-6">
                                    <h4 className="text-gray-800 font-semibold text-xl mb-1.5">{tn.content}</h4>
                                    {tn.extra?.exploreUrl &&
                                        <p className="text-gray-500 mb-3">
                                            {tn.extra.exploreUrl}
                                        </p>
                                    }
                                </div>
                            </li>
                        )}
                </ol>
            </div>
        </>
    )
}

function TripIdInput() {
    const [id, setId] = useState<string>();
    const router = useRouter();
    function loadTrip() {
        if (id) {
            router.replace(`/track?id=${id}`);
        }
    }
    return (
        <div className="m-6 flex justify-center text-center ">
            <div>
                <input
                    className={`form-control block px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding
                    border border-solid border-gray-300 rounded transition ease-in-out m-0 
                    focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none`}
                    onChange={evt => setId(evt.currentTarget.value)}></input>
                <div className="mt-2">
                    <Button disabled={!id} onClick={loadTrip}>Search</Button>
                </div>
            </div>
        </div>
    )
}