import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Shared/Navbar';
import Footer from '../../components/Shared/Footer';
import API_URL from '../../config/api';

const CITY_OPTIONS = [
    'Pune',
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
    'Jaipur',
    'Lucknow'
];

const DEFAULT_RADIUS_KM = 8;

const haversineKm = (a, b) => {
    if (!a || !b) return null;
    const toRad = (val) => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const getMetaDescriptionTag = () => {
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
    }
    return tag;
};

const TailorNearMe = () => {
    const [tailors, setTailors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [coords, setCoords] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle | locating | ready | blocked

    useEffect(() => {
        document.title = 'Tailor Near Me | Find Trusted Tailors Near You – KStitch';
        const meta = getMetaDescriptionTag();
        meta.setAttribute(
            'content',
            'Find trusted tailors near you for ladies & gents stitching, blouse stitching, and alterations. Verified local tailors on KStitch.'
        );
    }, []);

    const fetchTailors = async ({ lat, lng, locationText, radius }) => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams();
            params.set('limit', '24');
            params.set('skip', '0');
            if (radius) params.set('radius', String(radius));
            if (lat != null && lng != null) {
                params.set('lat', String(lat));
                params.set('lng', String(lng));
            }
            if (locationText) {
                params.set('locationText', locationText);
            }

            const response = await axios.get(`${API_URL}/api/tailors?${params.toString()}`);
            setTailors(response.data?.tailors || []);
        } catch (err) {
            console.error('Error fetching tailors:', err);
            setError('Unable to load nearby tailors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('blocked');
            setError('Location is not supported on this device.');
            return;
        }

        setLocationStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const nextCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCoords(nextCoords);
                setSelectedCity('');
                setLocationStatus('ready');
                fetchTailors({ lat: nextCoords.lat, lng: nextCoords.lng, radius: radiusKm });
            },
            () => {
                setLocationStatus('blocked');
                setError('Location permission blocked. Please choose a city.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleCityChange = (event) => {
        const city = event.target.value;
        setSelectedCity(city);
        setCoords(null);
        setLocationStatus(city ? 'ready' : 'idle');
        if (city) {
            fetchTailors({ locationText: city, radius: radiusKm });
        } else {
            setTailors([]);
        }
    };

    const handleRadiusChange = (event) => {
        const value = Number(event.target.value);
        setRadiusKm(value);
        if (coords) {
            fetchTailors({ lat: coords.lat, lng: coords.lng, radius: value });
        } else if (selectedCity) {
            fetchTailors({ locationText: selectedCity, radius: value });
        }
    };

    useEffect(() => {
        handleDetectLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mapSrc = useMemo(() => {
        const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (coords && key) {
            return `https://www.google.com/maps/embed/v1/search?key=${key}&q=tailors+near+${coords.lat},${coords.lng}&zoom=13`;
        }
        if (coords) {
            return `https://www.google.com/maps?q=tailors+near+${coords.lat},${coords.lng}&z=13&output=embed`;
        }
        if (selectedCity && key) {
            return `https://www.google.com/maps/embed/v1/search?key=${key}&q=tailors+near+${encodeURIComponent(selectedCity)}&zoom=13`;
        }
        if (selectedCity) {
            return `https://www.google.com/maps?q=tailors+near+${encodeURIComponent(selectedCity)}&z=12&output=embed`;
        }
        return `https://www.google.com/maps?q=tailors+near+me&z=5&output=embed`;
    }, [coords, selectedCity]);

    const listingData = useMemo(() => {
        return (tailors || []).map((tailor) => {
            const lat = tailor.location?.latitude ?? tailor.location?.lat;
            const lng = tailor.location?.longitude ?? tailor.location?.lng;
            const computedDistance = coords && lat && lng
                ? haversineKm(coords, { lat, lng })
                : null;
            return {
                ...tailor,
                computedDistance
            };
        });
    }, [tailors, coords]);

    const schemaData = useMemo(() => {
        const area = selectedCity || (coords ? 'Local Area' : 'Near You');
        return {
            '@context': 'https://schema.org',
            '@graph': listingData.slice(0, 10).map((tailor) => {
                const address = tailor.address || {};
                const lat = tailor.location?.latitude ?? tailor.location?.lat;
                const lng = tailor.location?.longitude ?? tailor.location?.lng;
                return {
                    '@type': 'LocalBusiness',
                    name: tailor.shopName || tailor.name || 'Tailor',
                    address: {
                        '@type': 'PostalAddress',
                        streetAddress: address.street || '',
                        addressLocality: address.city || '',
                        addressRegion: address.state || '',
                        postalCode: address.pincode || '',
                        addressCountry: 'IN'
                    },
                    geo: lat && lng ? {
                        '@type': 'GeoCoordinates',
                        latitude: lat,
                        longitude: lng
                    } : undefined,
                    telephone: tailor.phone || '',
                    aggregateRating: tailor.rating ? {
                        '@type': 'AggregateRating',
                        ratingValue: String(tailor.rating),
                        reviewCount: String(tailor.reviews?.length || 1)
                    } : undefined,
                    areaServed: area
                };
            })
        };
    }, [listingData, selectedCity, coords]);

    const locationLabel = selectedCity
        ? `Showing tailors near ${selectedCity}`
        : coords
            ? 'Showing tailors near your location'
            : 'Showing tailors near you';

    return (
        <div className="w-full min-h-screen bg-[#faf8f5]">
            <Navbar />

            <main className="pt-24 md:pt-28">
                <section className="mx-auto max-w-6xl px-6 md:px-10">
                    <div className="flex flex-col gap-4 md:gap-6">
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B7355]">KStitch</p>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">Tailors Near You</h1>
                            <p className="text-slate-600 max-w-2xl">
                                Looking for a tailor near me? Find verified tailors for custom stitching and alterations around you. Use location or choose your city to see the closest options.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <div className="md:col-span-2 flex flex-col gap-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDetectLocation}
                                        className="px-4 py-2.5 rounded-xl bg-[#6b4423] text-white text-sm font-semibold shadow-sm hover:bg-[#5a371d] transition-colors"
                                    >
                                        Use My Location
                                    </button>
                                    <select
                                        value={selectedCity}
                                        onChange={handleCityChange}
                                        className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700"
                                    >
                                        <option value="">Select a city</option>
                                        {CITY_OPTIONS.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={radiusKm}
                                        onChange={handleRadiusChange}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700"
                                    >
                                        <option value={5}>Within 5 km</option>
                                        <option value={8}>Within 8 km</option>
                                        <option value={10}>Within 10 km</option>
                                    </select>
                                </div>
                                <p className="text-sm text-slate-500">{locationLabel}</p>
                            </div>
                            <div className="flex flex-col justify-center rounded-xl bg-[#f3ede6] px-4 py-3">
                                <p className="text-sm text-slate-700 font-medium">Popular searches</p>
                                <p className="text-xs text-slate-500">Ladies tailor, blouse stitching, clothing alterations</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 md:px-10 mt-10">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Best Tailors Near You</h2>
                            {error && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6b4423]" />
                                </div>
                            ) : listingData.length === 0 ? (
                                <div className="py-10 text-center text-slate-500">
                                    No tailors found. Try changing your location or radius.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {listingData.map((tailor) => {
                                        const address = tailor.address || {};
                                        const services = tailor.services?.length
                                            ? tailor.services
                                            : tailor.specialization
                                                ? [tailor.specialization]
                                                : ['Ladies', 'Gents', 'Alterations'];
                                        const distanceLabel = tailor.distance
                                            ? `${Number(tailor.distance).toFixed(1)} km`
                                            : tailor.computedDistance
                                                ? `${tailor.computedDistance.toFixed(1)} km`
                                                : null;

                                        return (
                                            <article key={tailor._id} className="border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                                                {tailor.shopImage && (
                                                    <img
                                                        src={tailor.shopImage}
                                                        alt={`${tailor.shopName || tailor.name} shop`}
                                                        loading="lazy"
                                                        className="w-full h-32 object-cover rounded-xl"
                                                    />
                                                )}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="text-base font-semibold text-slate-900">{tailor.shopName || tailor.name}</h3>
                                                        <p className="text-xs text-slate-500">
                                                            {[address.street, address.city].filter(Boolean).join(', ') || 'Address available on profile'}
                                                        </p>
                                                    </div>
                                                    {distanceLabel && (
                                                        <span className="text-xs font-semibold text-[#6b4423] bg-[#f3ede6] px-2 py-1 rounded-full">
                                                            {distanceLabel}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <span className="text-[#f59e0b]">★</span>
                                                    <span className="font-medium">{tailor.rating || '4.5'}</span>
                                                    <span className="text-slate-400">({tailor.reviews?.length || 0} reviews)</span>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {services.slice(0, 4).map((service) => (
                                                        <span key={service} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                                                            {service}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {tailor.phone && (
                                                        <a
                                                            href={`tel:${tailor.phone}`}
                                                            className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:border-[#6b4423] hover:text-[#6b4423] transition-colors"
                                                        >
                                                            Call
                                                        </a>
                                                    )}
                                                    {tailor.phone && (
                                                        <a
                                                            href={`https://wa.me/${tailor.phone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                                                        >
                                                            WhatsApp
                                                        </a>
                                                    )}
                                                    <Link
                                                        to={`/tailor/${tailor._id}`}
                                                        className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg bg-[#6b4423] text-white hover:bg-[#5a371d] transition-colors"
                                                    >
                                                        Book Now
                                                    </Link>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-800">Nearby Tailors Map</h3>
                                    <p className="text-xs text-slate-500">Map updates based on your location or selected city.</p>
                                </div>
                                <iframe
                                    title="Tailors near me map"
                                    src={mapSrc}
                                    loading="lazy"
                                    className="w-full h-64 md:h-72 border-0"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900 mb-2">Clothing Alteration Services Near You</h2>
                                <p className="text-sm text-slate-600">
                                    From hemming and resizing to zipper replacements, discover trusted local tailors for fast alterations near your area.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 md:px-10 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900 mb-3">Ladies Tailor Near Me</h2>
                        <p className="text-sm text-slate-600">
                            Find specialists for blouse stitching, dress tailoring, lehenga fitting, and custom designs crafted to your style.
                        </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900 mb-3">Gents Tailor Near Me</h2>
                        <p className="text-sm text-slate-600">
                            Discover experienced tailors for shirts, suits, kurta-pyjama, and classic alterations done on time.
                        </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-2">
                        <h2 className="text-lg font-semibold text-slate-900 mb-3">Why Choose KStitch?</h2>
                        <ul className="text-sm text-slate-600 list-disc list-inside space-y-2">
                            <li>Verified tailor profiles with ratings and reviews.</li>
                            <li>Location-aware results so you can find the nearest experts quickly.</li>
                            <li>Easy booking, fast communication, and transparent services.</li>
                        </ul>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 md:px-10 mt-12 mb-12">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Frequently Asked Questions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                            <div>
                                <p className="font-semibold text-slate-800 mb-1">How do I find the nearest tailor?</p>
                                <p>Use the location button or select your city to view tailors within 5–10 km.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 mb-1">Do you verify tailors on KStitch?</p>
                                <p>Yes. We review profiles and show ratings so you can choose confidently.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 mb-1">Can I contact a tailor directly?</p>
                                <p>Absolutely. Use Call or WhatsApp from each card to reach them instantly.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 mb-1">What if I do not share my location?</p>
                                <p>No problem. Select a city and we will show tailors available there.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
        </div>
    );
};

export default TailorNearMe;
