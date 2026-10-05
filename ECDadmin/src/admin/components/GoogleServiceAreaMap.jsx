import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
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
} from '@mui/material';
import { MapPin, Navigation, X, Store, Building, Compass } from 'lucide-react';

// Helper to extract address, city, zone, district, state, pincode from Google Place or Geocoder result
export const parseGooglePlaceDetails = (placeObj) => {
  if (!placeObj) return {};
  let address = placeObj.formatted_address || placeObj.name || "";
  let city = "";
  let area = "";
  let zone = "";
  let district = "";
  let state = "";
  let pincode = "";

  if (Array.isArray(placeObj.address_components)) {
    for (const comp of placeObj.address_components) {
      const types = comp.types || [];

      // State (administrative_area_level_1)
      if (types.includes("administrative_area_level_1")) {
        state = comp.long_name;
      }

      // District (administrative_area_level_2 or level_3)
      if (types.includes("administrative_area_level_2")) {
        district = comp.long_name;
      } else if (!district && types.includes("administrative_area_level_3")) {
        district = comp.long_name;
      }

      // City / Locality
      if (types.includes("locality")) {
        city = comp.long_name;
      } else if (!city && types.includes("administrative_area_level_3")) {
        city = comp.long_name;
      } else if (!city && types.includes("administrative_area_level_2")) {
        city = comp.long_name;
      }

      // Sublocality / Zone / Neighborhood / Landmark
      if (types.includes("sublocality_level_1") || types.includes("sublocality") || types.includes("neighborhood")) {
        if (!area) area = comp.long_name;
        if (!zone) zone = comp.long_name;
      } else if (types.includes("sublocality_level_2") && !zone) {
        zone = comp.long_name;
      } else if ((types.includes("route") || types.includes("premise") || types.includes("point_of_interest")) && !zone) {
        zone = comp.long_name;
      }

      // Pincode (postal_code)
      if (types.includes("postal_code")) {
        pincode = comp.long_name;
      }
    }
  }

  // Fallbacks if missing
  if (!district && city) district = city;
  if (!city && district) city = district;

  if (!zone) {
    if (placeObj.name && placeObj.name !== address && placeObj.name !== city) {
      zone = placeObj.name;
    } else if (area) {
      zone = area;
    } else if (city) {
      zone = city;
    }
  }
  if (!area && zone) area = zone;

  return { address, city, area, zone, district, state, pincode };
};

export default function GoogleServiceAreaMap({
  lat = 22.7533,
  lng = 75.8937,
  radiusKm = 25,
  onLocationSelect,
  onRadiusChange,
}) {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const googleMapObj = useRef(null);
  const markerObj = useRef(null);
  const circleObj = useRef(null);

  const [loadingMap, setLoadingMap] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Suggestions state
  const [predictions, setPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadGoogleMaps()
      .then((googleMaps) => {
        if (!isMounted || !mapRef.current) return;

        const centerPos = { lat: Number(lat) || 22.7533, lng: Number(lng) || 75.8937 };

        // Initialize Google Map
        const map = new googleMaps.Map(mapRef.current, {
          center: centerPos,
          zoom: 12,
          mapTypeId: 'roadmap',
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: true,
        });

        googleMapObj.current = map;

        // Initialize Draggable Marker
        const marker = new googleMaps.Marker({
          position: centerPos,
          map,
          draggable: true,
          animation: googleMaps.Animation.DROP,
          title: 'Drag to set service area center',
        });

        markerObj.current = marker;

        // Initialize Geofence Radius Circle
        const circle = new googleMaps.Circle({
          map,
          radius: (Number(radiusKm) || 25) * 1000,
          fillColor: '#248C70',
          fillOpacity: 0.2,
          strokeColor: '#248C70',
          strokeWeight: 2,
          editable: false,
        });

        circleObj.current = circle;

        // Listen for Marker Drag End with reverse geocoding
        marker.addListener('dragend', () => {
          const newPos = marker.getPosition();
          if (newPos) {
            const dragLat = newPos.lat();
            const dragLng = newPos.lng();
            if (window.google && window.google.maps) {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: { lat: dragLat, lng: dragLng } }, (results, status) => {
                if (status === 'OK' && results && results[0] && onLocationSelect) {
                  onLocationSelect(dragLat, dragLng, results[0]);
                } else if (onLocationSelect) {
                  onLocationSelect(dragLat, dragLng);
                }
              });
            } else if (onLocationSelect) {
              onLocationSelect(dragLat, dragLng);
            }
          }
        });

        // Listen for Map Click to move marker with reverse geocoding
        map.addListener('click', (e) => {
          if (e && e.latLng) {
            const clickLat = e.latLng.lat();
            const clickLng = e.latLng.lng();
            marker.setPosition({ lat: clickLat, lng: clickLng });
            if (window.google && window.google.maps) {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: { lat: clickLat, lng: clickLng } }, (results, status) => {
                if (status === 'OK' && results && results[0] && onLocationSelect) {
                  onLocationSelect(clickLat, clickLng, results[0]);
                } else if (onLocationSelect) {
                  onLocationSelect(clickLat, clickLng);
                }
              });
            } else if (onLocationSelect) {
              onLocationSelect(clickLat, clickLng);
            }
          }
        });

        // Initialize Places Autocomplete bound to map location for nearby bias
        if (searchInputRef.current) {
          const autocomplete = new googleMaps.places.Autocomplete(searchInputRef.current, {
            fields: ['formatted_address', 'geometry', 'name', 'address_components'],
          });
          autocomplete.bindTo('bounds', map);

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place && place.geometry && place.geometry.location) {
              const placeLat = place.geometry.location.lat();
              const placeLng = place.geometry.location.lng();
              map.setCenter({ lat: placeLat, lng: placeLng });
              map.setZoom(15);
              marker.setPosition({ lat: placeLat, lng: placeLng });
              setSearchValue(place.name || place.formatted_address || '');
              setShowDropdown(false);
              if (onLocationSelect) {
                onLocationSelect(placeLat, placeLng, place);
              }
            }
          });
        }

        setLoadingMap(false);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setLoadingMap(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Google Places Autocomplete Suggestions with Nearby Bias
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

    // Set location bias based on current map center & bounds
    const center = googleMapObj.current
      ? googleMapObj.current.getCenter()
      : new window.google.maps.LatLng(lat, lng);

    const bounds = googleMapObj.current ? googleMapObj.current.getBounds() : null;

    const request = {
      input: text,
      location: center,
      radius: 50000, // 50 KM nearby bias radius
    };

    if (bounds) {
      request.bounds = bounds;
    }

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

  const fallbackGeocoder = (placeId, description) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: placeId }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const selLat = location.lat();
        const selLng = location.lng();

        if (googleMapObj.current && markerObj.current) {
          googleMapObj.current.setCenter({ lat: selLat, lng: selLng });
          googleMapObj.current.setZoom(15);
          markerObj.current.setPosition({ lat: selLat, lng: selLng });
        }

        if (onLocationSelect) {
          onLocationSelect(selLat, selLng, results[0]);
        }
      } else {
        geocoder.geocode({ address: description }, (res2, stat2) => {
          if (stat2 === 'OK' && res2 && res2[0]) {
            const loc2 = res2[0].geometry.location;
            const selLat2 = loc2.lat();
            const selLng2 = loc2.lng();
            if (googleMapObj.current && markerObj.current) {
              googleMapObj.current.setCenter({ lat: selLat2, lng: selLng2 });
              googleMapObj.current.setZoom(15);
              markerObj.current.setPosition({ lat: selLat2, lng: selLng2 });
            }
            if (onLocationSelect) {
              onLocationSelect(selLat2, selLng2, res2[0]);
            }
          }
        });
      }
    });
  };

  // Handle selecting a suggestion item
  const handleSelectPrediction = (prediction) => {
    setSearchValue(prediction.description);
    setShowDropdown(false);

    if (!window.google || !window.google.maps) return;

    const map = googleMapObj.current;
    if (map && window.google.maps.places) {
      const placesService = new window.google.maps.places.PlacesService(map);
      placesService.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['name', 'formatted_address', 'geometry', 'address_components'],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
            const selLat = place.geometry.location.lat();
            const selLng = place.geometry.location.lng();

            if (googleMapObj.current && markerObj.current) {
              googleMapObj.current.setCenter({ lat: selLat, lng: selLng });
              googleMapObj.current.setZoom(15);
              markerObj.current.setPosition({ lat: selLat, lng: selLng });
            }

            if (onLocationSelect) {
              onLocationSelect(selLat, selLng, place);
            }
          } else {
            fallbackGeocoder(prediction.place_id, prediction.description);
          }
        }
      );
    } else {
      fallbackGeocoder(prediction.place_id, prediction.description);
    }
  };

  // Sync Map position when lat/lng props change
  useEffect(() => {
    if (googleMapObj.current && markerObj.current && circleObj.current) {
      const pos = { lat: Number(lat), lng: Number(lng) };
      googleMapObj.current.setCenter(pos);
      markerObj.current.setPosition(pos);
      circleObj.current.setCenter(pos);
    }
  }, [lat, lng]);

  // Sync Radius circle when radiusKm changes
  useEffect(() => {
    if (circleObj.current) {
      circleObj.current.setRadius((Number(radiusKm) || 25) * 1000);
    }
  }, [radiusKm]);

  // Device GPS Location fetcher
  const handleFetchDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const devLat = pos.coords.latitude;
        const devLng = pos.coords.longitude;
        setIsLocating(false);
        if (googleMapObj.current && markerObj.current) {
          googleMapObj.current.setCenter({ lat: devLat, lng: devLng });
          googleMapObj.current.setZoom(15);
          markerObj.current.setPosition({ lat: devLat, lng: devLng });
        }
        if (onLocationSelect) {
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: devLat, lng: devLng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                onLocationSelect(devLat, devLng, results[0]);
              } else {
                onLocationSelect(devLat, devLng);
              }
            });
          } else {
            onLocationSelect(devLat, devLng);
          }
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
      {/* Search Input Bar with Nearby Suggestions & Device Location button */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            inputRef={searchInputRef}
            label="Search Nearby Location / Landmark / Restaurant / City..."
            placeholder="Type place name e.g. Gyani Ji Ka Dhaba, Vijay Nagar, Indore..."
            value={searchValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setShowDropdown(true);
            }}
            InputProps={{
              startAdornment: <MapPin size={18} className="text-[#248C70] mr-2 shrink-0" />,
              endAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {isSearching && <CircularProgress size={16} color="success" />}
                  {searchValue && (
                    <X
                      size={16}
                      className="cursor-pointer text-gray-400 hover:text-gray-700 ml-1"
                      onClick={() => {
                        setSearchValue('');
                        setPredictions([]);
                        setShowDropdown(false);
                      }}
                    />
                  )}
                </Box>
              ),
            }}
            sx={{ bgcolor: '#ffffff', borderRadius: 2 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleFetchDeviceLocation}
            disabled={isLocating}
            startIcon={isLocating ? <CircularProgress size={14} color="inherit" /> : <Navigation size={14} />}
            sx={{
              bgcolor: '#248C70',
              '&:hover': { bgcolor: '#1e755d' },
              textTransform: 'none',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              px: 2,
              height: 40,
            }}
          >
            {isLocating ? 'Locating...' : 'My Device Location'}
          </Button>
        </Box>

        {/* Live Suggestions Dropdown (High Z-Index, Nearby Biased) */}
        {showDropdown && predictions.length > 0 && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 9999,
              mt: 0.5,
              maxHeight: 280,
              overflowY: 'auto',
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            }}
          >
            <List dense disablePadding>
              <Box sx={{ px: 2, py: 0.8, bgcolor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857', letterSpacing: '0.5px' }}>
                  🎯 NEARBY PLACES & SUGGESTIONS
                </Typography>
              </Box>
              {predictions.map((item) => (
                <ListItemButton
                  key={item.place_id}
                  onClick={() => handleSelectPrediction(item)}
                  sx={{
                    borderBottom: '1px solid #f3f4f6',
                    '&:hover': { bgcolor: '#e8f5e9' },
                    py: 1,
                    px: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {item.types?.includes('restaurant') || item.types?.includes('food') ? (
                      <Store size={18} className="text-amber-600" />
                    ) : item.types?.includes('locality') ? (
                      <Building size={18} className="text-blue-600" />
                    ) : (
                      <MapPin size={18} className="text-[#248C70]" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.structured_formatting?.main_text || item.description}
                    secondary={item.structured_formatting?.secondary_text || ''}
                    primaryTypographyProps={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}
                    secondaryTypographyProps={{ fontSize: '11px', color: '#6b7280' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Google Map Container */}
      <Box
        sx={{
          width: '100%',
          height: 320,
          borderRadius: 2,
          overflow: 'hidden',
          border: '2px solid #248C70',
          position: 'relative',
          bgcolor: '#f3f4f6',
        }}
      >
        {loadingMap && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.9)',
              zIndex: 10,
            }}
          >
            <CircularProgress color="success" />
          </Box>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </Box>
    </Box>
  );
}
