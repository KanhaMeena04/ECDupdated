import React, { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../../../utils/googleMapsLoader";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
} from "@mui/material";
import { MapPin, Navigation, X, Store, Building } from "lucide-react";

export default function EaglesViewMap({ restaurants = [], riders = [] }) {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const googleMapObj = useRef(null);
  const markersRef = useRef([]);

  const [loadingMap, setLoadingMap] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Predictions dropdown state
  const [predictions, setPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadGoogleMaps()
      .then((googleMaps) => {
        if (!isMounted || !mapRef.current) return;

        let defaultCenter = { lat: 22.7235, lng: 75.8822 };
        if (restaurants.length > 0 && restaurants[0].location?.coordinates) {
          defaultCenter = {
            lat: restaurants[0].location.coordinates[1],
            lng: restaurants[0].location.coordinates[0],
          };
        } else if (riders.length > 0 && riders[0].currentLocation?.coordinates) {
          defaultCenter = {
            lat: riders[0].currentLocation.coordinates[1],
            lng: riders[0].currentLocation.coordinates[0],
          };
        }

        const map = new googleMaps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeId: "roadmap",
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        googleMapObj.current = map;

        // Places Autocomplete
        if (searchInputRef.current) {
          const autocomplete = new googleMaps.places.Autocomplete(searchInputRef.current, {
            fields: ["formatted_address", "geometry", "name", "address_components"],
          });
          autocomplete.bindTo("bounds", map);

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place && place.geometry && place.geometry.location) {
              const placeLat = place.geometry.location.lat();
              const placeLng = place.geometry.location.lng();
              map.setCenter({ lat: placeLat, lng: placeLng });
              map.setZoom(15);
              setSearchValue(place.name || place.formatted_address || "");
              setShowDropdown(false);
            }
          });
        }

        setLoadingMap(false);
      })
      .catch((err) => {
        console.error("Google Maps load error in EaglesView:", err);
        setLoadingMap(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Markers for Restaurants and Riders on Google Maps
  useEffect(() => {
    if (!googleMapObj.current || !window.google || !window.google.maps) return;
    const googleMaps = window.google.maps;
    const map = googleMapObj.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new googleMaps.LatLngBounds();
    let hasPoints = false;

    restaurants.forEach((r) => {
      const lat = r.location?.coordinates?.[1] || r.lat || 22.7235;
      const lng = r.location?.coordinates?.[0] || r.lng || 75.8822;
      const pos = { lat: Number(lat), lng: Number(lng) };

      const marker = new googleMaps.Marker({
        position: pos,
        map,
        title: r.name || "Restaurant",
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
        },
      });

      const infoWindow = new googleMaps.InfoWindow({
        content: `
          <div style="padding:6px; font-family:sans-serif;">
            <strong style="font-size:14px; color:#111827;">🍴 ${r.name || 'Restaurant'}</strong>
            <p style="margin:4px 0 0 0; font-size:12px; color:#4b5563;">${r.address || r.city || 'Active Partner'}</p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(pos);
      hasPoints = true;
    });

    riders.forEach((rd) => {
      const coords = rd.currentLocation?.coordinates || [75.8822, 22.7235];
      const lat = coords[1] || 22.7235;
      const lng = coords[0] || 75.8822;
      const pos = { lat: Number(lat), lng: Number(lng) };

      const marker = new googleMaps.Marker({
        position: pos,
        map,
        title: rd.name || "Rider",
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
        },
      });

      const infoWindow = new googleMaps.InfoWindow({
        content: `
          <div style="padding:6px; font-family:sans-serif;">
            <strong style="font-size:14px; color:#059669;">🛵 ${rd.name || 'Rider'}</strong>
            <p style="margin:4px 0 0 0; font-size:12px; color:#4b5563;">📱 ${rd.mobile || 'Active Rider'}</p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(pos);
      hasPoints = true;
    });

    if (hasPoints && (restaurants.length > 1 || riders.length > 1)) {
      map.fitBounds(bounds);
    }
  }, [restaurants, riders]);

  // Fetch Nearby Predictions
  const handleInputChange = (text) => {
    setSearchValue(text);
    if (!text || text.trim().length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    setIsSearching(true);
    const service = new window.google.maps.places.AutocompleteService();
    const map = googleMapObj.current;
    const center = map ? map.getCenter() : new window.google.maps.LatLng(22.7235, 75.8822);
    const bounds = map ? map.getBounds() : null;

    const request = {
      input: text,
      location: center,
      radius: 50000,
    };
    if (bounds) request.bounds = bounds;

    service.getPlacePredictions(request, (results, status) => {
      setIsSearching(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
        setShowDropdown(true);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    });
  };

  const handleSelectPrediction = (prediction) => {
    setSearchValue(prediction.description);
    setShowDropdown(false);

    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        const selLat = location.lat();
        const selLng = location.lng();

        if (googleMapObj.current) {
          googleMapObj.current.setCenter({ lat: selLat, lng: selLng });
          googleMapObj.current.setZoom(15);
        }
      }
    });
  };

  // Device GPS Location fetcher
  const handleFetchDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const devLat = pos.coords.latitude;
        const devLng = pos.coords.longitude;
        setIsLocating(false);
        if (googleMapObj.current) {
          googleMapObj.current.setCenter({ lat: devLat, lng: devLng });
          googleMapObj.current.setZoom(15);
        }
      },
      (err) => {
        setIsLocating(false);
        alert(`Location Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
      {/* Live Location Search Bar */}
      <Box sx={{ position: "relative", width: "100%" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            fullWidth
            size="small"
            inputRef={searchInputRef}
            label="Search Nearby Location / Landmark / Restaurant / City..."
            placeholder="Type location, landmark or city e.g. Gyani Ji Ka Dhaba, Vijay Nagar..."
            value={searchValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setShowDropdown(true);
            }}
            InputProps={{
              startAdornment: <MapPin size={18} className="text-[#248C70] mr-2 shrink-0" />,
              endAdornment: (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {isSearching && <CircularProgress size={16} color="success" />}
                  {searchValue && (
                    <X
                      size={16}
                      className="cursor-pointer text-gray-400 hover:text-gray-700 ml-1"
                      onClick={() => {
                        setSearchValue("");
                        setPredictions([]);
                        setShowDropdown(false);
                      }}
                    />
                  )}
                </Box>
              ),
            }}
            sx={{ bgcolor: "#ffffff", borderRadius: 2 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleFetchDeviceLocation}
            disabled={isLocating}
            startIcon={isLocating ? <CircularProgress size={14} color="inherit" /> : <Navigation size={14} />}
            sx={{
              bgcolor: "#248C70",
              "&:hover": { bgcolor: "#1e755d" },
              textTransform: "none",
              fontWeight: 700,
              whiteSpace: "nowrap",
              px: 2,
              height: 40,
            }}
          >
            {isLocating ? "Locating..." : "My Device Location"}
          </Button>
        </Box>

        {/* Live Suggestions Dropdown */}
        {showDropdown && predictions.length > 0 && (
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 9999,
              mt: 0.5,
              maxHeight: 280,
              overflowY: "auto",
              borderRadius: 2,
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
          >
            <List dense disablePadding>
              <Box sx={{ px: 2, py: 0.8, bgcolor: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#047857", letterSpacing: "0.5px" }}>
                  🎯 NEARBY PLACES & SUGGESTIONS
                </Typography>
              </Box>
              {predictions.map((item) => (
                <ListItemButton
                  key={item.place_id}
                  onClick={() => handleSelectPrediction(item)}
                  sx={{
                    borderBottom: "1px solid #f3f4f6",
                    "&:hover": { bgcolor: "#e8f5e9" },
                    py: 1,
                    px: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {item.types?.includes("restaurant") || item.types?.includes("food") ? (
                      <Store size={18} className="text-amber-600" />
                    ) : item.types?.includes("locality") ? (
                      <Building size={18} className="text-blue-600" />
                    ) : (
                      <MapPin size={18} className="text-[#248C70]" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.structured_formatting?.main_text || item.description}
                    secondary={item.structured_formatting?.secondary_text || ""}
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}
                    secondaryTypographyProps={{ fontSize: "11px", color: "#6b7280" }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Real Google Map */}
      <Box
        sx={{
          height: "520px",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          position: "relative",
          bgcolor: "#f3f4f6",
        }}
      >
        {loadingMap && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(255,255,255,0.9)",
              zIndex: 10,
            }}
          >
            <CircularProgress color="success" />
          </Box>
        )}
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </Box>
    </Box>
  );
}
