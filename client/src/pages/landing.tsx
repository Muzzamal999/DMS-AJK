import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ShieldAlert, FileSearch, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const [stats, setStats] = useState({
    certificatesIssued: 0,
    registeredCitizens: 0,
    avgProcessingDays: '3-5'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/stats`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-20 bg-primary text-primary-foreground flex items-center justify-between px-8 shadow-md">
        <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
          <ShieldAlert className="w-8 h-8 text-secondary" />
          <span>DMS AJ&K</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/verify" className="hover:text-secondary transition-colors">Verify Certificate</Link>
          <a href="#services" className="hover:text-secondary transition-colors">Services</a>
          <a href="#about" className="hover:text-secondary transition-colors">About</a>
        </nav>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline" className="text-primary border-primary-foreground/20 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors border-2 bg-transparent font-semibold shadow-none text-white">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-sm">Register</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative h-[600px] flex items-center justify-center text-white text-center">
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <img src="/hero-mountain.png" alt="AJ&K Mountains" className="absolute inset-0 w-full h-full object-cover z-0" />
          
          <div className="relative z-20 max-w-4xl px-4 space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">
              Official Domicile Management System
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Secure, transparent, and efficient digital issuance of Domicile Certificates for the citizens of Azad Jammu & Kashmir.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg font-bold px-8 shadow-lg">Apply Online</Button>
              </Link>
              <Link href="/verify">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg font-semibold px-8 shadow-lg backdrop-blur-sm">Verify Document</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-primary">{stats.certificatesIssued.toLocaleString()}+</div>
              <div className="text-muted-foreground font-medium">Certificates Issued</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-primary">{stats.registeredCitizens.toLocaleString()}+</div>
              <div className="text-muted-foreground font-medium">Registered Citizens</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-primary">{stats.avgProcessingDays} Days</div>
              <div className="text-muted-foreground font-medium">Average Processing Time</div>
            </div>
          </div>
        </section>

        <section id="services" className="py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Core Digital Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Access your official documents and government services through our secure platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <FileSearch size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Verify Certificate</h3>
                <p className="text-muted-foreground leading-relaxed">Instantly authenticate any AJ&K domicile certificate using its unique 12-digit identification number or QR code.</p>
              </div>

              <div className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Online Application</h3>
                <p className="text-muted-foreground leading-relaxed">Apply for a new domicile certificate entirely online. Track your application status in real-time from submission to issuance.</p>
              </div>

              <div className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Secure Document Vault</h3>
                <p className="text-muted-foreground leading-relaxed">Your approved certificates are stored securely in your personal digital vault, accessible anytime, anywhere.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-primary text-primary-foreground/70 py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl text-white">
              <ShieldAlert className="w-6 h-6 text-secondary" />
              <span>DMS AJ&K</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              Official Domicile Management System for the Government of Azad Jammu & Kashmir.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/verify" className="hover:text-white transition-colors">Verify Certificate</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Citizen Login</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">New Application</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/10 text-sm text-center">
          &copy; {new Date().getFullYear()} Government of Azad Jammu & Kashmir. All rights reserved.
        </div>
      </footer>
    </div>
  );
}