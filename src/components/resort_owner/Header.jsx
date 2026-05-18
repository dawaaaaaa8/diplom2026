// "use client";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// export default function ResortOwnerHeader() {
//   const router = useRouter();

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("role_id");
//     router.push("/login");
//   };

//   return (
//     <header style={{ background: "#0f172a", color: "white", padding: "15px" }}>
//       <h2>Resort Owner Panel</h2>

//       <nav style={{ display: "flex", gap: "20px" }}>
//         <Link href="/resort-owner/dashboard">Dashboard</Link>
//         <Link href="/resort-owner/resorts">Resorts</Link>
//         <Link href="/resort-owner/bookings">Bookings</Link>
//         <button onClick={logout}>Logout</button>
//       </nav>
//     </header>
//   );
// }