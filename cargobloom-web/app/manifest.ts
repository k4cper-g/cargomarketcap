import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "CargoBloom",
        short_name: "CargoBloom",
        description:
            "The Bloomberg for logistics. Real-time freight rates, market trends, and analytics for the transport industry.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
            {
                src: "/cargobloom.ico",
                sizes: "any",
                type: "image/x-icon",
            },
            {
                src: "/cargobloom-icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
        ],
    };
}
