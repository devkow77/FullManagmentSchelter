import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const center = { lat: 50.0417, lng: 22.0047 };

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "16px",
};

const mapOptions = {
  disableDefaultUI: false,
};

const GoogleMaps = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (loadError) {
    return (
      <div className="mx-auto flex h-60 max-w-5xl items-center justify-center rounded-2xl bg-black/20 sm:h-75 md:h-100">
        <p>Nie udało się załadować mapy Google.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="mx-auto flex h-60 max-w-5xl items-center justify-center rounded-2xl bg-black/20 sm:h-75 md:h-100">
        <p>Ładowanie Mapy Google...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto h-60 max-w-5xl rounded-2xl bg-black/20 sm:h-75 md:h-100">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={mapOptions}
      >
        <MarkerF position={center} title="Fundacja Schronisko" />
      </GoogleMap>
    </div>
  );
};

export default GoogleMaps;
