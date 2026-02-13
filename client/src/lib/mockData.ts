import { Home, Building2, User, Wrench, FileText, CheckCircle, Clock } from "lucide-react";

export const properties = [
  {
    id: 1,
    title: "Executive Loft Downtown",
    type: "Loft",
    price: 3500,
    address: "123 Business Blvd, Downtown",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    beds: 1,
    baths: 1.5,
    sqft: 1200,
  },
  {
    id: 2,
    title: "Luxury Condo with View",
    type: "Condo",
    price: 4200,
    address: "456 Skyline Ave, Uptown",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    beds: 2,
    baths: 2,
    sqft: 1500,
  },
  {
    id: 3,
    title: "Suburban Family Home",
    type: "Single Family Home",
    price: 2800,
    address: "789 Maple Dr, Suburbia",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    beds: 3,
    baths: 2.5,
    sqft: 2200,
  },
];

export const corporateLeases = [
  {
    id: 101,
    employeeName: "Sarah Jenkins",
    employeeId: "EMP-402",
    propertyId: 1,
    propertyName: "Executive Loft Downtown",
    startDate: "2023-01-15",
    endDate: "2024-01-15",
    status: "Active",
    rent: 3500
  },
  {
    id: 102,
    employeeName: "Michael Chang",
    employeeId: "EMP-993",
    propertyId: 2,
    propertyName: "Luxury Condo with View",
    startDate: "2023-06-01",
    endDate: "2024-06-01",
    status: "Active",
    rent: 4200
  },
  {
    id: 103,
    employeeName: "Elena Rodriguez",
    employeeId: "EMP-155",
    propertyId: 3,
    propertyName: "Suburban Family Home",
    startDate: "2023-09-01",
    endDate: "2024-09-01",
    status: "Renewing",
    rent: 2800
  },
  {
    id: 104,
    employeeName: "David Kim",
    employeeId: "EMP-772",
    propertyId: 1,
    propertyName: "Metro City Apartment",
    startDate: "2024-01-01",
    endDate: "2025-01-01",
    status: "Pending Move-in",
    rent: 3100
  }
];

export const vendors = [
  {
    id: 1,
    name: "Sparkle Cleaners",
    service: "Cleaning",
    rating: 4.8,
    status: "Approved",
  },
  {
    id: 2,
    name: "FixIt Fast HVAC",
    service: "HVAC",
    rating: 4.9,
    status: "Approved",
  },
  {
    id: 3,
    name: "Elite Staging Pros",
    service: "Staging",
    rating: 4.7,
    status: "Pending Docs",
  },
];

export const documents = [
  { id: 1, name: "Lease Agreement", status: "Signed", date: "2023-10-15" },
  { id: 2, name: "Pet Addendum", status: "Pending", date: "2023-10-16" },
  { id: 3, name: "Move-in Checklist", status: "New", date: "2023-10-18" },
];

export const cryptoCurrencies = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", enabled: true },
  { id: "eth", name: "Ethereum", symbol: "ETH", enabled: true },
  { id: "usdc", name: "USD Coin", symbol: "USDC", enabled: true },
  { id: "sol", name: "Solana", symbol: "SOL", enabled: false },
];
