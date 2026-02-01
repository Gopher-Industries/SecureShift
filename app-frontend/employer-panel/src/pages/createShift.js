import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import http from "../lib/http";
import "./CreateShift.css";

const toDateTime = (date, time) => {
  if (!date || !time) return null;
  return new Date(`${date}T${time}`);
};

const shiftSchema = yup.object({
  title: yup.string().required("Shift title is required"),
  siteId: yup
    .string()
    .required("Select a site")
    .notOneOf(["__new"], "Save the new site before continuing"),
  date: yup.string().required("Date is required"),
  startTime: yup.string().required("Start time is required"),
  endTime: yup
    .string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (value) {
      const { startTime, date } = this.parent;
      if (!value || !startTime || !date) return true;
      const start = toDateTime(date, startTime);
      const end = toDateTime(date, value);
      return end && start && end > start;
    }),
  breakMinutes: yup
    .number()
    .typeError("Break time must be a number")
    .min(0, "Break time cannot be negative")
    .max(180, "Break time seems too long")
    .required("Break time is required"),
  payRate: yup
    .number()
    .typeError("Pay rate must be a number")
    .min(0, "Pay rate cannot be negative")
    .required("Pay rate is required"),
  shiftType: yup.string().oneOf(["day", "night"]).required(),
  instructions: yup
    .string()
    .required("Provide shift instructions")
    .min(10, "Add a few more details for clarity"),
  location: yup.string().required("Location is required"),
  guards: yup.array().of(yup.string()),
  newSiteName: yup.string(),
  newSiteAddress: yup.string(),
});

const seededSites = [
  {
    id: "marvel-stadium",
    name: "Marvel Stadium",
    address: "740 Bourke St, Docklands VIC",
    lat: -37.8167,
    lng: 144.9475,
  },
  {
    id: "chadstone",
    name: "Chadstone Shopping Centre",
    address: "1341 Dandenong Rd, Chadstone VIC",
    lat: -37.8864,
    lng: 145.0828,
  },
  {
    id: "aig-hq",
    name: "AIG Solutions HQ",
    address: "373 Collins St, Melbourne VIC",
    lat: -37.8172,
    lng: 144.9632,
  },
];

const guardOptions = [
  { id: "g-smith", name: "John Smith", skills: "Events, RSA" },
  { id: "g-chan", name: "Amy Chan", skills: "Retail, Concierge" },
  { id: "g-rojas", name: "Marco Rojas", skills: "Night patrol" },
  { id: "g-nguyen", name: "Hanh Nguyen", skills: "Crowd control" },
];

const guardAssignments = {
  "g-smith": [
    { date: "2026-01-17", startTime: "13:00", endTime: "21:00", siteName: "Marvel Stadium" },
  ],
  "g-chan": [
    { date: "2026-01-16", startTime: "09:00", endTime: "17:30", siteName: "Chadstone Shopping Centre" },
  ],
  "g-rojas": [
    { date: "2026-01-18", startTime: "18:00", endTime: "23:30", siteName: "AIG Solutions HQ" },
  ],
  "g-nguyen": [],
};

const existingShifts = [
  {
    id: "shift-142",
    siteId: "marvel-stadium",
    siteName: "Marvel Stadium",
    date: "2026-01-17",
    startTime: "12:00",
    endTime: "20:30",
  },
  {
    id: "shift-205",
    siteId: "chadstone",
    siteName: "Chadstone Shopping Centre",
    date: "2026-01-18",
    startTime: "07:00",
    endTime: "15:00",
  },
];

const mapDefault = { lat: -37.8136, lng: 144.9631 }; // Melbourne CBD

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || `site-${Date.now()}`;

const loadGooglePlaces = (onReady, onError) => {
  if (window.google?.maps?.places) {
    onReady();
    return;
  }
  if (document.getElementById("ss-places-script")) return;
  const script = document.createElement("script");
  script.id = "ss-places-script";
  const key = process.env.REACT_APP_GOOGLE_MAPS_KEY || "";
  const keyParam = key ? `&key=${key}` : "";
  script.src = `https://maps.googleapis.com/maps/api/js?libraries=places${keyParam}`;
  script.async = true;
  script.defer = true;
  script.onload = onReady;
  script.onerror = onError;
  document.body.appendChild(script);
};

const CreateShift = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState(seededSites);
  const [showNewSite, setShowNewSite] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [blockingIssues, setBlockingIssues] = useState([]);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsFailed, setMapsFailed] = useState(false);
  const [locationPin, setLocationPin] = useState(mapDefault);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const locationInputRef = useRef(null);
  const newSiteInputRef = useRef(null);
  const locationAutocompleteRef = useRef(null);
  const newSiteAutocompleteRef = useRef(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(shiftSchema),
    defaultValues: {
      title: "",
      siteId: "",
      date: "",
      startTime: "",
      endTime: "",
      breakMinutes: 30,
      payRate: 0,
      shiftType: "day",
      instructions: "",
      location: "",
      guards: [],
      newSiteName: "",
      newSiteAddress: "",
    },
  });

  const watchSiteId = watch("siteId");
  const watchGuards = watch("guards");
  const newSiteNameReg = register("newSiteName");
  const newSiteAddressReg = register("newSiteAddress");

  useEffect(() => {
    loadGooglePlaces(
      () => setMapsReady(true),
      () => setMapsFailed(true)
    );
  }, []);

  useEffect(() => {
    if (!mapsReady || !locationInputRef.current || locationAutocompleteRef.current) return;
    if (!window.google?.maps?.places) {
      setMapsFailed(true);
      return;
    }
    const instance = new window.google.maps.places.Autocomplete(locationInputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
    });
    locationAutocompleteRef.current = instance;
    instance.addListener("place_changed", () => {
      const place = instance.getPlace();
      const formatted = place.formatted_address || place.name || locationInputRef.current.value;
      const loc = place.geometry?.location;
      if (formatted) {
        setValue("location", formatted, { shouldValidate: true, shouldDirty: true });
      }
      if (loc) {
        setLocationPin({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [mapsReady, setValue]);

  useEffect(() => {
    if (!mapsReady || !newSiteInputRef.current || newSiteAutocompleteRef.current) return;
    if (!window.google?.maps?.places) {
      setMapsFailed(true);
      return;
    }
    const instance = new window.google.maps.places.Autocomplete(newSiteInputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
    });
    newSiteAutocompleteRef.current = instance;
    instance.addListener("place_changed", () => {
      const place = instance.getPlace();
      const formatted = place.formatted_address || place.name || newSiteInputRef.current.value;
      const loc = place.geometry?.location;
      if (formatted) {
        setValue("newSiteAddress", formatted, { shouldValidate: true, shouldDirty: true });
        setValue("location", formatted, { shouldValidate: true, shouldDirty: true });
      }
      if (loc) {
        setLocationPin({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [mapsReady, setValue]);

  useEffect(() => {
    if (!mapRef.current || (!mapsReady && !mapsFailed)) return;
    if (mapsReady && !window.google?.maps) {
      setMapsFailed(true);
      return;
    }

    if (mapsReady && window.google?.maps) {
      if (!mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: locationPin,
          zoom: 13,
          disableDefaultUI: true,
        });
        markerRef.current = new window.google.maps.Marker({ position: locationPin, map: mapInstance.current });
      } else {
        mapInstance.current.setCenter(locationPin);
        markerRef.current?.setPosition(locationPin);
      }
    }
  }, [locationPin, mapsReady, mapsFailed]);

  useEffect(() => {
    if (!watchSiteId) return;
    if (watchSiteId === "__new") {
      setShowNewSite(true);
      return;
    }
    const selectedSite = sites.find((s) => s.id === watchSiteId);
    if (!selectedSite) return;
    setShowNewSite(false);
    setValue("location", selectedSite.address, { shouldValidate: true });
    if (selectedSite.lat && selectedSite.lng) {
      setLocationPin({ lat: selectedSite.lat, lng: selectedSite.lng });
    }
  }, [watchSiteId, sites, setValue]);

  const overlaps = (startA, endA, startB, endB) => {
    if (!startA || !endA || !startB || !endB) return false;
    return startA < endB && endA > startB;
  };

  const findConflicts = (payload) => {
    const issues = [];
    const start = toDateTime(payload.date, payload.startTime);
    const end = toDateTime(payload.date, payload.endTime);

    const timeConflicts = existingShifts.filter(
      (shift) =>
        shift.siteId === payload.siteId &&
        shift.date === payload.date &&
        overlaps(start, end, toDateTime(shift.date, shift.startTime), toDateTime(shift.date, shift.endTime))
    );

    if (timeConflicts.length) {
      issues.push(
        `Time clash: ${timeConflicts
          .map((c) => `${c.siteName} ${c.startTime}–${c.endTime}`)
          .join(", ")}`
      );
    }

    const guardConflicts = (payload.guards || []).flatMap((guardId) => {
      const blocks = guardAssignments[guardId] || [];
      const hit = blocks.find((b) =>
        b.date === payload.date &&
        overlaps(start, end, toDateTime(b.date, b.startTime), toDateTime(b.date, b.endTime))
      );
      return hit ? [`${guardOptions.find((g) => g.id === guardId)?.name || guardId} busy at ${hit.siteName}`] : [];
    });

    if (guardConflicts.length) {
      issues.push(`Guard availability conflicts: ${guardConflicts.join(", ")}`);
    }

    return issues;
  };

  const handleAddSite = async () => {
    const { newSiteName, newSiteAddress } = getValues();
    const trimmedName = newSiteName.trim();
    const trimmedAddress = newSiteAddress.trim();
    const missing = [];
    if (!trimmedName) missing.push("name");
    if (!trimmedAddress) missing.push("address");
    if (missing.length) {
      setBlockingIssues([`Add new site: ${missing.join(" and ")} required`]);
      return;
    }
    const newId = slugify(trimmedName);
    const nextSite = {
      id: newId,
      name: trimmedName,
      address: trimmedAddress,
      lat: locationPin.lat,
      lng: locationPin.lng,
    };
    setSites((prev) => [...prev, nextSite]);
    setValue("siteId", newId, { shouldValidate: true });
    setShowNewSite(false);
    setBlockingIssues([]);
  };

  const onPreview = (values) => {
    const issues = findConflicts(values);
    setBlockingIssues(issues);
    if (issues.length) {
      setPreviewData(null);
      return;
    }

    const selectedSite = sites.find((s) => s.id === values.siteId);
    setPreviewData({ ...values, selectedSite, locationPin });
  };

  const onSubmit = async (values) => {
    const issues = findConflicts(values);
    setBlockingIssues(issues);
    if (issues.length) return;

    const selectedSite = sites.find((s) => s.id === values.siteId);
    const payload = {
      title: values.title,
      siteId: values.siteId,
      siteName: selectedSite?.name,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      breakMinutes: values.breakMinutes,
      payRate: values.payRate,
      shiftType: values.shiftType,
      instructions: values.instructions,
      guards: values.guards || [],
      location: {
        street: values.location,
        lat: locationPin.lat,
        lng: locationPin.lng,
      },
    };

    try {
      await http.post("/shifts", payload);
      setPreviewData(null);
      navigate("/manage-shift");
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Unable to create shift";
      setBlockingIssues([message]);
    }
  };

  const renderFieldError = (field) =>
    errors[field] ? <span className="cs-field__error">{errors[field]?.message}</span> : null;

  return (
    <div className="cs-shell">
      <div className="cs-topbar">
        <div>
          <p className="cs-kicker">Shift creation</p>
          <h1 className="cs-title">Create a new shift</h1>
          <p className="cs-subtitle">Structured, full-screen flow with guard checks and location precision.</p>
        </div>
        <div className="cs-topbar__actions">
          <button className="cs-ghost" type="button" onClick={() => navigate("/manage-shift")}>Cancel</button>
          <button className="cs-ghost" type="button" onClick={() => navigate("/employer-dashboard")}>Back to dashboard</button>
        </div>
      </div>

      {blockingIssues.length > 0 && (
        <div className="cs-banner cs-banner--error">
          {blockingIssues.map((issue, idx) => (
            <div key={idx}>{issue}</div>
          ))}
        </div>
      )}

      <form className="cs-grid" onSubmit={handleSubmit(onPreview)}>
        <section className="cs-card cs-card--form">
          <div className="cs-section">
            <div className="cs-field">
              <label htmlFor="title">Shift title</label>
              <input id="title" placeholder="e.g. Retail security" {...register("title")} />
              {renderFieldError("title")}
            </div>

            <div className="cs-field">
              <label htmlFor="siteId">Select site</label>
              <div className="cs-site-row">
                <select id="siteId" {...register("siteId")}>
                  <option value="">Choose a saved site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                  <option value="__new">➕ Add new site</option>
                </select>
                <button type="button" className="cs-ghost" onClick={() => setShowNewSite(true)}>Add new</button>
              </div>
              {renderFieldError("siteId")}
            </div>

            {showNewSite && (
              <div className="cs-inline-card">
                <div className="cs-field">
                  <label htmlFor="newSiteName">New site name</label>
                  <input
                    id="newSiteName"
                    placeholder="Site name"
                    {...newSiteNameReg}
                    ref={(node) => {
                      newSiteNameReg.ref(node);
                    }}
                  />
                </div>
                <div className="cs-field">
                  <label htmlFor="newSiteAddress">New site address</label>
                  <input
                    id="newSiteAddress"
                    placeholder="123 Example St, Suburb"
                    {...newSiteAddressReg}
                    ref={(node) => {
                      newSiteAddressReg.ref(node);
                      newSiteInputRef.current = node;
                    }}
                    onChange={(e) => {
                      newSiteAddressReg.onChange(e);
                      setValue("location", e.target.value, { shouldDirty: true });
                    }}
                  />
                </div>
                <div className="cs-inline-actions">
                  <button type="button" className="cs-ghost" onClick={() => setShowNewSite(false)}>Cancel</button>
                  <button type="button" className="cs-primary" onClick={handleAddSite}>Save site</button>
                </div>
              </div>
            )}

            <div className="cs-field">
              <label htmlFor="location">Location (Google autocomplete)</label>
              <Controller
                control={control}
                name="location"
                render={({ field }) => (
                  <input
                    id="location"
                    placeholder="Type to search and pin"
                    {...field}
                    ref={(node) => {
                      locationInputRef.current = node;
                      field.ref(node);
                    }}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                  />
                )}
              />
              {renderFieldError("location")}
              <p className="cs-hint">We pin this exact location on the map. Use autocomplete for accuracy.</p>
            </div>

            <div className="cs-two-col">
              <div className="cs-field">
                <label htmlFor="date">Date</label>
                <input id="date" type="date" {...register("date")} />
                {renderFieldError("date")}
              </div>
              <div className="cs-field">
                <label>Shift type</label>
                <div className="cs-pillset">
                  {["day", "night"].map((type) => (
                    <label key={type} className={`cs-pill ${watch("shiftType") === type ? "is-active" : ""}`}>
                      <input type="radio" value={type} {...register("shiftType")} />
                      {type === "day" ? "Day" : "Night"}
                    </label>
                  ))}
                </div>
                {renderFieldError("shiftType")}
              </div>
            </div>

            <div className="cs-three-col">
              <div className="cs-field">
                <label htmlFor="startTime">Start time</label>
                <input id="startTime" type="time" {...register("startTime")} />
                {renderFieldError("startTime")}
              </div>
              <div className="cs-field">
                <label htmlFor="endTime">End time</label>
                <input id="endTime" type="time" {...register("endTime")} />
                {renderFieldError("endTime")}
              </div>
              <div className="cs-field">
                <label htmlFor="breakMinutes">Break time (minutes)</label>
                <input id="breakMinutes" type="number" min="0" max="180" {...register("breakMinutes")} />
                {renderFieldError("breakMinutes")}
              </div>
              <div className="cs-field">
                <label htmlFor="payRate">Pay rate ($/hr)</label>
                <input id="payRate" type="number" min="0" step="0.01" {...register("payRate")} />
                {renderFieldError("payRate")}
              </div>
            </div>

            <div className="cs-field">
              <label htmlFor="instructions">Detailed instructions</label>
              <textarea id="instructions" rows={4} placeholder="Access notes, contact on arrival, PPE requirements" {...register("instructions")} />
              {renderFieldError("instructions")}
            </div>

            <div className="cs-field">
              <label>Assign guards (optional)</label>
              <div className="cs-taglist">
                <Controller
                  control={control}
                  name="guards"
                  render={({ field }) => (
                    <>
                      {guardOptions.map((guard) => {
                        const selected = field.value?.includes(guard.id);
                        return (
                          <label key={guard.id} className={`cs-tag ${selected ? "is-active" : ""}`}>
                            <input
                              type="checkbox"
                              value={guard.id}
                              checked={selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                if (checked) field.onChange([...(field.value || []), guard.id]);
                                else field.onChange((field.value || []).filter((id) => id !== guard.id));
                              }}
                            />
                            <span>{guard.name}</span>
                            <small>{guard.skills}</small>
                          </label>
                        );
                      })}
                    </>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="cs-actions">
            <button type="button" className="cs-ghost" onClick={() => navigate("/manage-shift")}>Save draft</button>
            <button type="submit" className="cs-primary">Preview shift</button>
          </div>
        </section>

        <aside className="cs-card cs-card--map">
          <div className="cs-card__header">
            <div>
              <p className="cs-kicker">Map & timing</p>
              <h3 className="cs-side-title">Pinned location</h3>
            </div>
          </div>

          <div className="cs-map" ref={mapRef}>
            {!mapsReady && !mapsFailed && <div className="cs-map__loading">Loading Google Maps…</div>}
            {mapsFailed && <div className="cs-map__loading">Map unavailable. Location will still be saved.</div>}
          </div>

          <div className="cs-side-list">
            <div className="cs-side-row">
              <span>Shift type</span>
              <strong className="cs-chip">{watch("shiftType") === "night" ? "Night" : "Day"}</strong>
            </div>
            <div className="cs-side-row">
              <span>Schedule</span>
              <strong>
                {watch("date") || "—"} · {watch("startTime") || "--:--"} – {watch("endTime") || "--:--"}
              </strong>
            </div>
            <div className="cs-side-row">
              <span>Break time</span>
              <strong>{watch("breakMinutes") || 0} min</strong>
            </div>
            <div className="cs-side-row">
              <span>Assigned guards</span>
              <strong>{watchGuards?.length ? `${watchGuards.length} selected` : "Optional"}</strong>
            </div>
          </div>
        </aside>
      </form>

      {previewData && (
        <div className="cs-modal">
          <div className="cs-modal__dialog">
            <div className="cs-modal__head">
              <div>
                <p className="cs-kicker">Review</p>
                <h3>Preview shift before posting</h3>
              </div>
              <button type="button" className="cs-ghost" onClick={() => setPreviewData(null)}>Edit details</button>
            </div>

            <div className="cs-preview-grid">
              <div>
                <p className="cs-label">Title</p>
                <h4>{previewData.title}</h4>
              </div>
              <div>
                <p className="cs-label">Site</p>
                <h4>{previewData.selectedSite?.name || "—"}</h4>
                <p className="cs-subtle">{previewData.selectedSite?.address || previewData.location}</p>
              </div>
              <div>
                <p className="cs-label">Timing</p>
                <h4>
                  {previewData.date} · {previewData.startTime} – {previewData.endTime}
                </h4>
                <p className="cs-subtle">Break: {previewData.breakMinutes} min</p>
                <p className="cs-subtle">Pay rate: ${previewData.payRate}/hr</p>
              </div>
              <div>
                <p className="cs-label">Shift type</p>
                <h4>{previewData.shiftType === "night" ? "Night" : "Day"}</h4>
              </div>
              <div>
                <p className="cs-label">Guards</p>
                <h4>
                  {previewData.guards?.length
                    ? previewData.guards
                        .map((id) => guardOptions.find((g) => g.id === id)?.name || id)
                        .join(", ")
                    : "Not assigned"}
                </h4>
              </div>
              <div>
                <p className="cs-label">Instructions</p>
                <p className="cs-subtle">{previewData.instructions}</p>
              </div>
            </div>

            <div className="cs-modal__actions">
              <button type="button" className="cs-ghost" onClick={() => setPreviewData(null)}>
                Back to form
              </button>
              <button type="button" className="cs-primary" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
                {isSubmitting ? "Posting…" : "Confirm & create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateShift;
