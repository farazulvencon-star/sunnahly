import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="text-lg font-bold">Natural Shefa</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              বাংলাদেশের সেরা প্রাকৃতিক ও অর্গানিক পণ্যের অনলাইন শপ। ১০০% খাঁটি পণ্যের নিশ্চয়তা।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">দ্রুত লিংক</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="/about" className="hover:text-background transition-colors">আমাদের সম্পর্কে</a></li>
              <li><a href="/products" className="hover:text-background transition-colors">সকল পণ্য</a></li>
              <li><a href="/contact" className="hover:text-background transition-colors">যোগাযোগ</a></li>
              <li><a href="/track" className="hover:text-background transition-colors">অর্ডার ট্র্যাক করুন</a></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold mb-4">নীতিমালা</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="/privacy" className="hover:text-background transition-colors">প্রাইভেসি পলিসি</a></li>
              <li><a href="/terms" className="hover:text-background transition-colors">শর্তাবলী</a></li>
              <li><a href="/refund" className="hover:text-background transition-colors">রিফান্ড পলিসি</a></li>
              <li><a href="/shipping" className="hover:text-background transition-colors">শিপিং পলিসি</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">যোগাযোগ</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>০১XXXXXXXXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@naturalshefa.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>ঢাকা, বাংলাদেশ</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-background/50">
            © ২০২৬ Natural Shefa। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
