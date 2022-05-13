import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ListOfTripNotes, Trip, TripNote, TripsApi } from "../modules/fleetonroute";
import configuration from "../utils/configuration";

export default function TrackPage() {
    const router = useRouter();
    const { id } = router.query;
    const [trip, setTrip] = useState<Trip>();
    const [tripNotes, setTripNotes] = useState<ListOfTripNotes>();

    useEffect(() => {
        if (id) {
            new TripsApi(configuration)
                .listTripNotes(id as string)
                .then(setTripNotes)
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
    }, [id]);

    if (!trip) {
        return <></>
    }

    return (
        <>
            <div className="p-4">
                <h1 className="text-3xl">{trip?.address}</h1>
            </div>

            <div className="p-4">
                <ol className="border-l border-gray-300">
                    {
                        tripNotes?.records?.map(tn =>
                            <li>
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
    );
}