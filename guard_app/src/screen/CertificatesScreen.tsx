import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, TouchableOpacity } from "react-native";

type DocItem = {
  id: string;
  name: string;
  uploadedAt: string;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const formatDate = (d?: Date) => (d ? d.toLocaleDateString() : "—");
const formatDMY = (d?: Date) => {
  if (!d) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};


function computeStatus(expiry?: Date) {
  if (!expiry) return "Valid"; // placeholder if backend not ready
  const today = startOfDay(new Date());
  const exp = startOfDay(expiry);

  if (exp < today) return "Expired";

  const msDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / msDay);

  if (daysLeft <= 30) return "Expiring";
  return "Valid";
}

export default function CertificatesScreen() {
  const docs: DocItem[] = useMemo(
    () => [
      { id: "1", name: "Security License", uploadedAt: "20/01/2026" },
      { id: "2", name: "CPR", uploadedAt: "18/01/2026" },
      { id: "3", name: "First Aid", uploadedAt: "10/01/2026" },
    ],
    []
  );

  const [expiryDates, setExpiryDates] = useState<Record<string, Date | undefined>>({});
  const [pickerDocId, setPickerDocId] = useState<string | null>(null);
  const [warningDocId, setWarningDocId] = useState<string | null>(null);

  const [isPickerOpen, setIsPickerOpen] = useState(false);

const makeNextDates = (days = 365) => {
  const arr: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    arr.push(d);
  }
  return arr;
};

const dateOptions = useMemo(() => makeNextDates(365), []);

  
  const renderItem = ({ item }: { item: DocItem }) => {
    const expiry = expiryDates[item.id];
    const status = computeStatus(expiry);

    return (
      <View
        style={{
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#e2e2e2",
          backgroundColor: "white",
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "700" }}>{item.name}</Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: status === "Expired" ? "#ffb3b3" : status === "Expiring" ? "#ffe3a3" : "#cfcfcf",
              backgroundColor: status === "Expired" ? "#ffecec" : status === "Expiring" ? "#fff7df" : "#f3f3f3",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700" }}>{status}</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={{ opacity: 0.75 }}>Upload date: {item.uploadedAt}</Text>
          <Text style={{ opacity: 0.75 }}>Expiry date: {formatDMY(expiry)}</Text>
        </View>

        <Pressable
          onPress={() => {
            setPickerDocId(item.id);
            setWarningDocId(null);
            setIsPickerOpen(true);
          }}
          style={{
            marginTop: 10,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e2e2e2",
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "700" }}>Set Expiry Date</Text>
        </Pressable>

        {warningDocId === item.id ? (
          <Text style={{ marginTop: 8, color: "#c00", fontSize: 12 }}>
            Expiry date cannot be before today.
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#fafafa" }}>
      <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 12 }}>Certificates</Text>

      {docs.length === 0 ? (
        <View style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#e2e2e2" }}>
          <Text style={{ fontWeight: "800" }}>No documents</Text>
          <Text style={{ marginTop: 6, opacity: 0.8 }}>
            Upload a document to see it listed here with expiry details.
          </Text>
        </View>
      ) : (
        <FlatList data={docs} keyExtractor={(x) => x.id} renderItem={renderItem} />
      )}

<Modal visible={isPickerOpen} transparent animationType="slide">
  <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}>
    <View style={{ backgroundColor: "white", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "60%" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "800" }}>Select Expiry Date</Text>
        <TouchableOpacity onPress={() => setIsPickerOpen(false)}>
          <Text style={{ fontWeight: "800" }}>Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dateOptions}
        keyExtractor={(d) => d.toISOString()}
        renderItem={({ item: d }) => (
          <TouchableOpacity
            onPress={() => {
              if (!pickerDocId) return;
              // Since we only show today+ future dates, it's always valid.
              setExpiryDates((prev) => ({ ...prev, [pickerDocId]: d }));
              setWarningDocId(null);
              setIsPickerOpen(false);
              setPickerDocId(null);
            }}
            style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" }}
          >
            <Text>{formatDMY(d)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  </View>
</Modal>


    </View>
  );
}
