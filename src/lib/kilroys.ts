import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  where,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Circle, Kilroy, PlaceMetadata, Place } from './types';

/**
 * Ensure place metadata exists in Firestore
 */
export async function ensurePlaceExists(place: Place): Promise<void> {
  const placeRef = doc(db, 'places', place.place_id);
  const placeDoc = await getDoc(placeRef);

  if (!placeDoc.exists()) {
    const metadata: PlaceMetadata = {
      place_id: place.place_id,
      place_name: place.place_name,
      address: place.address,
      created_at: Date.now(),
    };
    await setDoc(placeRef, metadata);
  }
}

/**
 * Get all kilroys for a place, optionally filtered by circle
 */
export async function getKilroys(
  placeId: string,
  circle?: Circle
): Promise<Kilroy[]> {
  const kilroysRef = collection(db, 'places', placeId, 'kilroys');

  let q;
  if (circle) {
    q = query(
      kilroysRef,
      where('circle', '==', circle),
      orderBy('created_at', 'desc')
    );
  } else {
    q = query(kilroysRef, orderBy('created_at', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Kilroy[];
}

/**
 * Check if any kilroys exist at a place
 */
export async function hasKilroys(placeId: string): Promise<boolean> {
  const kilroysRef = collection(db, 'places', placeId, 'kilroys');
  const q = query(kilroysRef, orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Upload image and create a new kilroy
 */
export async function createKilroy(
  place: Place,
  imageBlob: Blob,
  caption: string,
  circle: Circle
): Promise<Kilroy> {
  // Ensure place exists
  await ensurePlaceExists(place);

  // Generate unique ID
  const kilroyId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Upload image
  const imagePath = `kilroys/${place.place_id}/${kilroyId}.jpg`;
  const imageRef = ref(storage, imagePath);
  await uploadBytes(imageRef, imageBlob, { contentType: 'image/jpeg' });
  const imageUrl = await getDownloadURL(imageRef);

  // Create kilroy document
  const kilroy: Omit<Kilroy, 'id'> = {
    place_id: place.place_id,
    image_url: imageUrl,
    caption: caption.trim().substring(0, 200),
    circle,
    created_at: Date.now(),
  };

  const kilroyRef = doc(db, 'places', place.place_id, 'kilroys', kilroyId);
  await setDoc(kilroyRef, kilroy);

  return {
    id: kilroyId,
    ...kilroy,
  };
}
