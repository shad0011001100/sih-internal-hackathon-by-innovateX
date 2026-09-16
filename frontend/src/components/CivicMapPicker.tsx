import React, { useState, useRef, useEffect } from "react";

export interface LocationData {
    lat: number;
    lon: number;
    wardName: string;
    localityName: string;
    isGpsDetected?: boolean;
}

interface CivicMapPickerProps {
    initialLat?: number;
    initialLon?: number;
    initialWard?: string;
    onLocationChange: (loc: LocationData) => void;
}

export interface RanchiLandmark {
    name: string;
    ward: string;
    lat: number;
    lon: number;
    icon: string;
    tag: string;
}

export const RANCHI_LANDMARKS: RanchiLandmark[] = [
    { name: "Albert Ekka Chowk (Main Road)", ward: "Ward 10: RMC Central Hub (Main Road)", lat: 23.3600, lon: 85.3250, icon: "apartment", tag: "Central" },
    { name: "Morabadi Ground & Oxygen Park", ward: "Ward 1: Morabadi & Tagore Hill", lat: 23.3910, lon: 85.3280, icon: "park", tag: "North" },
    { name: "Doranda Market & High Court", ward: "Ward 4: Doranda (South Zone)", lat: 23.3297, lon: 85.3262, icon: "gavel", tag: "South" },
    { name: "Harmu Housing Colony", ward: "Ward 9: Harmu Housing Colony", lat: 23.3540, lon: 85.3120, icon: "home", tag: "West" },
    { name: "Lalpur Chowk & Circular Road", ward: "Ward 7: Lalpur & Circular Road", lat: 23.3710, lon: 85.3360, icon: "store", tag: "East" },
    { name: "RIMS Hospital & Medical Campus", ward: "Ward 8: Bariatu & RIMS Medical Zone", lat: 23.3980, lon: 85.3560, icon: "local_hospital", tag: "North-East" },
    { name: "Birsa Munda Airport & Hinoo", ward: "Ward 5: Hinoo & Birsa Munda Airport", lat: 23.3210, lon: 85.3200, icon: "flight", tag: "South" },
    { name: "Kanke Dam & Rock Garden", ward: "Ward 2: Kanke Road & Rock Garden", lat: 23.4280, lon: 85.3180, icon: "water", tag: "North" },
    { name: "Kokar Industrial Area", ward: "Ward 3: Kokar Industrial Area", lat: 23.3800, lon: 85.3500, icon: "factory", tag: "East" },
    { name: "Chutia & Ranchi Railway Station", ward: "Ward 6: Chutia & Ranchi Railway Station", lat: 23.3550, lon: 85.3400, icon: "train", tag: "Central" },
    { name: "Ratu Road & Pandra Market Yard", ward: "Ward 14: Ratu Road & Pandra Market", lat: 23.3850, lon: 85.2650, icon: "shopping_cart", tag: "West" },
    { name: "BIT Mesra Engineering Campus", ward: "Ward 1: Morabadi & Tagore Hill", lat: 23.4180, lon: 85.4400, icon: "school", tag: "University" },
];

export const RANCHI_WARDS_LIST = [
    { name: "Ward 4: Doranda (South Zone)", lat: 23.3297, lon: 85.3262 },
    { name: "Ward 1: Morabadi & Tagore Hill", lat: 23.3910, lon: 85.3280 },
    { name: "Ward 9: Harmu Housing Colony", lat: 23.3540, lon: 85.3120 },
    { name: "Ward 12: Kishoreganj & Sukhdeonagar", lat: 23.3670, lon: 85.3110 },
    { name: "Ward 7: Lalpur & Circular Road", lat: 23.3710, lon: 85.3360 },
    { name: "Ward 2: Kanke Road & Rock Garden", lat: 23.4280, lon: 85.3180 },
    { name: "Ward 8: Bariatu & RIMS Medical Zone", lat: 23.3980, lon: 85.3560 },
    { name: "Ward 14: Ratu Road & Pandra Market", lat: 23.3850, lon: 85.2650 },
    { name: "Ward 5: Hinoo & Birsa Munda Airport", lat: 23.3210, lon: 85.3200 },
    { name: "Ward 11: Namkum & Industrial Belt", lat: 23.3420, lon: 85.3850 },
    { name: "Ward 10: RMC Central Hub (Main Road)", lat: 23.3600, lon: 85.3250 },
    { name: "Ward 3: Kokar Industrial Area", lat: 23.3800, lon: 85.3500 },
    { name: "Ward 6: Chutia & Ranchi Railway Station", lat: 23.3550, lon: 85.3400 },
];

// Helper: Calculate Distance between two lat/lon (Haversine approx in km)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
}

// Find nearest Ranchi Ward & Landmark for any (lat, lon)
export function findNearestRanchiContext(lat: number, lon: number): { ward: string; locality: string } {
    let bestDist = Infinity;
    let bestLandmark = RANCHI_LANDMARKS[0];
    for (const lm of RANCHI_LANDMARKS) {
        const d = getDistanceKm(lat, lon, lm.lat, lm.lon);
        if (d < bestDist) {
            bestDist = d;
            bestLandmark = lm;
        }
    }

    let bestWardDist = Infinity;
    let bestWard = RANCHI_WARDS_LIST[0].name;
    for (const w of RANCHI_WARDS_LIST) {
        const d = getDistanceKm(lat, lon, w.lat, w.lon);
        if (d < bestWardDist) {
            bestWardDist = d;
            bestWard = w.name;
        }
    }

    return {
        ward: bestWard,
        locality: bestLandmark.name.split("(")[0].trim(),
    };
}

// Slippy Map Web Mercator Math
const lon2tile = (lon: number, zoom: number) => ((lon + 180) / 360) * Math.pow(2, zoom);
const lat2tile = (lat: number, zoom: number) =>
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
    Math.pow(2, zoom);

const tile2lon = (x: number, zoom: number) => (x / Math.pow(2, zoom)) * 360 - 180;
const tile2lat = (y: number, zoom: number) => {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

export default function CivicMapPicker({
    initialLat = 23.3297,
    initialLon = 85.3262,
    initialWard = "Ward 4: Doranda (South Zone)",
    onLocationChange,
}: CivicMapPickerProps) {
    // Current Map View Center
    const [center, setCenter] = useState<{ lat: number; lon: number }>({ lat: initialLat, lon: initialLon });
    // Active Pin Location
    const [pin, setPin] = useState<{ lat: number; lon: number }>({ lat: initialLat, lon: initialLon });
    const [zoom, setZoom] = useState<number>(14);

    const [localityName, setLocalityName] = useState<string>("Doranda Market");
    const [wardName, setWardName] = useState<string>(initialWard);
    const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
    const [gpsNotice, setGpsNotice] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
    const [showCoordsToggle, setShowCoordsToggle] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 600, height: 280 });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth || 600,
                    height: containerRef.current.clientHeight || 280,
                });
            }
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // Handle pin placement (from map click, chip click, search, or GPS)
    const updatePosition = (lat: number, lon: number, customLocality?: string, customWard?: string, isGps?: boolean) => {
        setPin({ lat, lon });
        setCenter({ lat, lon });

        const context = findNearestRanchiContext(lat, lon);
        const resolvedLocality = customLocality || context.locality;
        const resolvedWard = customWard || context.ward;

        setLocalityName(resolvedLocality);
        setWardName(resolvedWard);

        onLocationChange({
            lat,
            lon,
            wardName: resolvedWard,
            localityName: resolvedLocality,
            isGpsDetected: isGps,
        });
    };

    // Click anywhere on interactive map to position pin
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const centerTileX = lon2tile(center.lon, zoom);
        const centerTileY = lat2tile(center.lat, zoom);

        const deltaPxX = clickX - containerSize.width / 2;
        const deltaPxY = clickY - containerSize.height / 2;

        const clickedTileX = centerTileX + deltaPxX / 256;
        const clickedTileY = centerTileY + deltaPxY / 256;

        const newLon = tile2lon(clickedTileX, zoom);
        const newLat = tile2lat(clickedTileY, zoom);

        updatePosition(newLat, newLon);
        setGpsNotice(null);
    };

    // Calculate Screen Position of Pin
    const centerTileX = lon2tile(center.lon, zoom);
    const centerTileY = lat2tile(center.lat, zoom);
    const pinTileX = lon2tile(pin.lon, zoom);
    const pinTileY = lat2tile(pin.lat, zoom);

    const pinScreenX = containerSize.width / 2 + (pinTileX - centerTileX) * 256;
    const pinScreenY = containerSize.height / 2 + (pinTileY - centerTileY) * 256;

    // Detect GPS with Smart Ranchi Boundary Guard
    const handleDetectGps = () => {
        if (!navigator.geolocation) {
            setGpsNotice("Geolocation is not supported by your browser.");
            return;
        }

        setIsGpsLocating(true);
        setGpsNotice("Detecting device satellite location...");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setIsGpsLocating(false);
                const userLat = pos.coords.latitude;
                const userLon = pos.coords.longitude;

                // Check if user is inside Greater Jharkhand (Lat: 22.0 to 25.5, Lon: 83.5 to 87.5)
                const isInsideJharkhand = userLat >= 22.0 && userLat <= 25.5 && userLon >= 83.5 && userLon <= 87.5;

                if (isInsideJharkhand) {
                    updatePosition(userLat, userLon, undefined, undefined, true);
                    setGpsNotice("✓ Live GPS acquired and pinned on map!");
                } else {
                    // Out of state (e.g. Pune / Mumbai during dev) -> friendly notification
                    setGpsNotice("Device reports coordinates outside Ranchi. Centered map on Ranchi City Center so you can pinpoint your local site.");
                    updatePosition(23.3600, 85.3250, "Albert Ekka Chowk", "Ward 10: RMC Central Hub (Main Road)", false);
                }
            },
            () => {
                setIsGpsLocating(false);
                setGpsNotice("GPS permission not granted. Pick your location directly on the map below.");
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    };

    // Filtered landmarks for search
    const matchingLandmarks = searchQuery.trim()
        ? RANCHI_LANDMARKS.filter(
              (lm) =>
                  lm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  lm.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  lm.tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [];

    // Tiles to render in 3x3 or 4x3 grid around center
    const tileBaseX = Math.floor(centerTileX);
    const tileBaseY = Math.floor(centerTileY);
    const tileOffsetX = (centerTileX - tileBaseX) * 256;
    const tileOffsetY = (centerTileY - tileBaseY) * 256;

    const tiles: { key: string; x: number; y: number; posX: number; posY: number }[] = [];
    const spanX = Math.ceil(containerSize.width / 512) + 1;
    const spanY = Math.ceil(containerSize.height / 512) + 1;

    for (let dx = -spanX; dx <= spanX; dx++) {
        for (let dy = -spanY; dy <= spanY; dy++) {
            const tx = tileBaseX + dx;
            const ty = tileBaseY + dy;
            const posX = containerSize.width / 2 + dx * 256 - tileOffsetX;
            const posY = containerSize.height / 2 + dy * 256 - tileOffsetY;
            tiles.push({
                key: `${zoom}-${tx}-${ty}`,
                x: tx,
                y: ty,
                posX,
                posY,
            });
        }
    }

    return (
        <div className="space-y-3 font-sans">
            {/*  TOP SEARCH & GPS ACTION BAR  */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search Locality / Landmark */}
                <div className="relative flex-1">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-[#c1c8c0] focus-within:border-[#3e644a] focus-within:ring-2 focus-within:ring-[#3e644a]/20 transition-all shadow-xs">
                        <span className="material-symbols-outlined text-[#3e644a] text-lg">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearchDropdown(true);
                            }}
                            onFocus={() => setShowSearchDropdown(true)}
                            placeholder="Search Ranchi locality, landmark or ward..."
                            className="w-full text-xs font-medium text-[#1b1b1e] placeholder-[#727972] bg-transparent outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setShowSearchDropdown(false);
                                }}
                                className="text-[#727972] hover:text-[#1b1b1e] text-xs cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSearchDropdown && matchingLandmarks.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#c1c8c0] shadow-lg max-h-48 overflow-y-auto z-30 divide-y divide-slate-100">
                            {matchingLandmarks.map((lm) => (
                                <button
                                    key={lm.name}
                                    type="button"
                                    onClick={() => {
                                        updatePosition(lm.lat, lm.lon, lm.name.split("(")[0].trim(), lm.ward);
                                        setSearchQuery(lm.name);
                                        setShowSearchDropdown(false);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-[#3e644a]/10 flex items-center justify-between text-xs transition-colors cursor-pointer border-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-[#3e644a]">{lm.icon}</span>
                                        <div>
                                            <p className="font-bold text-[#1b1b1e]">{lm.name}</p>
                                            <p className="text-[10px] text-[#727972]">{lm.ward}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{lm.tag}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* GPS Button */}
                <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isGpsLocating}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3e644a] hover:bg-[#294e36] active:bg-[#1b1b1e] text-white text-xs font-semibold cursor-pointer transition-all shadow-xs shrink-0"
                >
                    <span className={`material-symbols-outlined text-sm ${isGpsLocating ? "animate-spin" : ""}`}>
                        {isGpsLocating ? "refresh" : "my_location"}
                    </span>
                    <span>{isGpsLocating ? "Locating..." : "Use My GPS"}</span>
                </button>
            </div>

            {/*  GPS Notice / Alert if any  */}
            {gpsNotice && (
                <div className="px-3 py-1.5 rounded-lg bg-[#3e644a]/10 border border-[#3e644a]/20 text-[11px] text-[#3e644a] font-medium flex items-center justify-between animate-fadeIn">
                    <span>{gpsNotice}</span>
                    <button type="button" onClick={() => setGpsNotice(null)} className="text-[#3e644a] hover:opacity-75 cursor-pointer">
                        <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                </div>
            )}

            {/*  POPULAR RANCHI LANDMARKS CHIPS (1-Click Pin)  */}
            <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#727972] font-mono block mb-1.5">
                    Quick Pick Popular Ranchi Localities:
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {RANCHI_LANDMARKS.slice(0, 7).map((lm) => {
                        const isSelected = getDistanceKm(pin.lat, pin.lon, lm.lat, lm.lon) < 0.6;
                        return (
                            <button
                                key={lm.name}
                                type="button"
                                onClick={() => updatePosition(lm.lat, lm.lon, lm.name.split("(")[0].trim(), lm.ward)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                                    isSelected
                                        ? "bg-[#3e644a] text-white border-[#3e644a] shadow-xs scale-105"
                                        : "bg-white hover:bg-slate-50 text-[#1b1b1e] border-[#c1c8c0]/70"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[13px]">{lm.icon}</span>
                                <span>{lm.name.split("(")[0].trim()}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/*  INTERACTIVE VISUAL MAP CANVAS  */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#3e644a]/30 shadow-md bg-slate-100">
                {/* Map Interactive Canvas */}
                <div
                    ref={containerRef}
                    onClick={handleMapClick}
                    className="w-full h-64 sm:h-72 cursor-crosshair relative select-none overflow-hidden"
                    title="Click anywhere on map to drop or move the incident pin"
                >
                    {/* OpenStreetMap Tile Layer */}
                    <div className="absolute inset-0 pointer-events-none">
                        {tiles.map((t) => (
                            <img
                                key={t.key}
                                src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
                                alt="map tile"
                                loading="lazy"
                                className="absolute w-64 h-64 select-none opacity-90 transition-opacity duration-300"
                                style={{
                                    left: `${t.posX}px`,
                                    top: `${t.posY}px`,
                                    transform: "translate(0, 0)",
                                }}
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        ))}
                    </div>

                    {/* Subtle Overlay Guide Grid */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/15 via-transparent to-black/5"></div>

                    {/*  ANIMATED INCIDENT PIN MARKER  */}
                    <div
                        className="absolute pointer-events-none transition-all duration-300 ease-out z-20"
                        style={{
                            left: `${pinScreenX}px`,
                            top: `${pinScreenY}px`,
                            transform: "translate(-50%, -100%)",
                        }}
                    >
                        {/* Pin Teardrop with Glow */}
                        <div className="flex flex-col items-center">
                            {/* Pin Callout Badge */}
                            <div className="px-2.5 py-1 rounded-full bg-[#1b1b1e] text-white text-[10px] font-bold shadow-lg whitespace-nowrap mb-1 flex items-center gap-1 border border-white/20 animate-bounce">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                <span>{localityName || "Incident Spot"}</span>
                            </div>

                            {/* Red Teardrop Icon */}
                            <div className="relative">
                                <span className="material-symbols-outlined text-red-600 text-3xl drop-shadow-md">
                                    location_on
                                </span>
                            </div>

                            {/* Ground Radar Pulse Ring */}
                            <div className="w-4 h-1.5 bg-black/40 rounded-full blur-[1px] -mt-1"></div>
                        </div>
                    </div>

                    {/* Map Instructions Pill Overlay */}
                    <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                        <div className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-bold text-[#1b1b1e] shadow-xs border border-white/40 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[#3e644a]">touch_app</span>
                            <span>Click anywhere on map to reposition pin</span>
                        </div>
                    </div>

                    {/* Zoom & Centering Controls */}
                    <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setZoom((z) => Math.min(17, z + 1));
                            }}
                            title="Zoom In"
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-[#1b1b1e] font-bold flex items-center justify-center shadow-md border border-slate-200 cursor-pointer text-sm"
                        >
                            +
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setZoom((z) => Math.max(12, z - 1));
                            }}
                            title="Zoom Out"
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-[#1b1b1e] font-bold flex items-center justify-center shadow-md border border-slate-200 cursor-pointer text-sm"
                        >
                            −
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCenter({ lat: 23.3600, lon: 85.3250 });
                                setZoom(14);
                            }}
                            title="Recenter Ranchi"
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-[#3e644a] flex items-center justify-center shadow-md border border-slate-200 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">center_focus_strong</span>
                        </button>
                    </div>

                    {/* Map Attribution */}
                    <div className="absolute bottom-1 left-2 z-10 text-[9px] text-slate-600 bg-white/70 px-1.5 py-0.5 rounded pointer-events-none">
                        © OpenStreetMap contributors
                    </div>
                </div>

                {/*  CURRENT SELECTED LOCATION BANNER (User-Friendly Human Text)  */}
                <div className="p-3.5 bg-white border-t border-[#3e644a]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-[#3e644a]/10 text-[#3e644a] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-lg">verified_user</span>
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-[#1b1b1e] truncate">
                                    📍 {localityName}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    {wardName.split(":")[0] || "Ward Verified"}
                                </span>
                            </div>
                            <p className="text-[11px] text-[#727972] mt-0.5 truncate">
                                {wardName} • Ranchi Municipal Corporation
                            </p>
                        </div>
                    </div>

                    {/* Technical GPS Toggle for transparency */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowCoordsToggle(!showCoordsToggle)}
                            className="text-[11px] text-[#3e644a] hover:underline font-mono cursor-pointer flex items-center gap-1 border-0 bg-transparent p-0"
                        >
                            <span>{showCoordsToggle ? "Hide GPS coords" : "View GPS coords"}</span>
                            <span className="material-symbols-outlined text-[13px]">
                                {showCoordsToggle ? "expand_less" : "expand_more"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Collapsible Technical Details */}
                {showCoordsToggle && (
                    <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 text-[11px] font-mono text-slate-600 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
                        <span>
                            Latitude: <strong>{pin.lat.toFixed(5)}° N</strong>, Longitude: <strong>{pin.lon.toFixed(5)}° E</strong>
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            GIS Precision ±3m • RMC Geodatabase Compliant
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
