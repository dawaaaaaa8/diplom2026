import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    "Үйлчилгээ": [
      { label: "Амралтын газрууд", href: "/resorts" },
      { label: "Захиалга хийх", href: "/booking" },
      { label: "Тусламж", href: "/help" },
      { label: "Түгээмэл асуултууд", href: "/faq" },
    ],
    "Бидний тухай": [
      { label: "Компани", href: "/about" },
      { label: "Бүтээгдэхүүн", href: "/products" },
      { label: "Хамтран ажиллах", href: "/partners" },
      { label: "Карьер", href: "/careers" },
    ],
    "Хууль эрх зүй": [
      { label: "Нууцлалын бодлого", href: "/privacy" },
      { label: "Үйлчилгээний нөхцөл", href: "/terms" },
      { label: "Күүкийн тохиргоо", href: "/cookies" },
      { label: "Төлбөрийн нөхцөл", href: "/payment-terms" },
    ],
  };

  const socialLinks = [
    { icon: <FaFacebook />, href: "https://facebook.com", label: "Facebook" },
    { icon: <FaTwitter />, href: "https://twitter.com", label: "Twitter" },
    { icon: <FaInstagram />, href: "https://instagram.com", label: "Instagram" },
    { icon: <FaLinkedin />, href: "https://linkedin.com", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">TB</span>
              </div>
              <span className="text-2xl font-bold">Travel Booking</span>
            </Link>
            <p className="text-gray-300 mb-6">
              Бид таны аяллыг илүү хялбар, найдвартай болгохын төлөө ажилладаг. 
              Шинэ аялал, гайхамшигт дурсамжуудыг эндээс эхлүүлээрэй.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FaPhone className="text-blue-400" />
                <span>+976 9999 9999</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaEnvelope className="text-blue-400" />
                <span>info@travelbooking.mn</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-blue-400" />
                <span>Улаанбаатар хот, Сүхбаатар дүүрэг</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Бидэнтэй холбогдох:</span>
              <div className="flex space-x-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Имэйл хаягаа оруулна уу"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                  {/* Бүртгүүлэх */}
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Шинэ санал болголт, хөнгөлөлтийн мэдээллийг хүлээн авах
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-400">
            © {currentYear}.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Сайтыг хөгжүүлэгч: У.Даваадорж
          </p>
        </div>
      </div>
    </footer>
  );
}