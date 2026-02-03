import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TailorShowcase from '../components/Customer/TailorShowcase';
import SecondaryHero from '../components/Customer/SecondaryHero';
import ManagementTools from '../components/Tailor/ManagementTools';
import Footer from '../components/Shared/Footer';
import axios from 'axios';
import gsap from 'gsap';
import Navbar from '../components/Shared/Navbar';
import HeroPage from '../components/Customer/HeroPage';
import SearchBar from '../components/Shared/SearchBar';
import API_URL from '../config/api';

const Homepage = () => {
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [showNavbarSearch, setShowNavbarSearch] = useState(false);
  const heroSearchRef = useRef(null);

  // Fetch tailors with pagination
  const fetchTailors = async (skipValue = 0, append = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const limit = 8;
      const response = await axios.get(`${API_URL}/api/tailors?limit=${limit}&skip=${skipValue}`);

      const newTailors = response.data.tailors || [];

      if (append) {
        setTailors(prev => [...prev, ...newTailors]);
      } else {
        setTailors(newTailors);
      }

      setHasMore(response.data.hasMore);
      setSkip(skipValue + newTailors.length);
    } catch (error) {
      console.error('Error fetching tailors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTailors(0, false);
  }, []);

  // Handle scroll for search bar transitions
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.35; // 50vh hero - transition at 35% of viewport

      if (scrollY > heroHeight) {
        // Scrolled past hero - show navbar search, hide hero search
        setShowNavbarSearch(true);
        if (heroSearchRef.current) {
          gsap.to(heroSearchRef.current, {
            opacity: 0,
            y: -20,
            duration: 0.5,
            ease: 'power3.out'
          });
        }
      } else {
        // Near top - hide navbar search, show hero search
        setShowNavbarSearch(false);
        if (heroSearchRef.current) {
          gsap.to(heroSearchRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power3.out'
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Infinite scroll detection
  useEffect(() => {
    const handleInfiniteScroll = () => {
      if (loading || !hasMore) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= docHeight * 0.8) {
        fetchTailors(skip, true);
      }
    };

    window.addEventListener('scroll', handleInfiniteScroll);
    return () => window.removeEventListener('scroll', handleInfiniteScroll);
  }, [loading, hasMore, skip]);

  return (
    <div className="w-full min-h-screen bg-[#faf8f5]">
      {/* Navbar with conditional search bar */}
      <Navbar showSearchBar={showNavbarSearch} />

      {/* Hero Section with integrated search bar */}
      <HeroPage
        heroSearchRef={heroSearchRef}
        onSearch={(data) => console.log('Search:', data)}
      />

      {/* Main Content */}
      <div className="relative bg-[#faf8f5] pt-16">
        <TailorShowcase tailors={tailors} loading={loading} hasMore={hasMore} />
        <SecondaryHero />
        <ManagementTools />
        <Footer />
      </div>
    </div>
  );
};

export default Homepage;