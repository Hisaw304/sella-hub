import React from "react";
import Hero from "../components/Hero";
import FeaturedListings from "../components/FeaturedListings";
import Categories from "../components/Categories";
import HowItWorks from "../components/HowItWorks";
import WhySell from "../components/WhySell";
import PricingPlans from "../components/PricingPlans";
import FooterCTA from "../components/FooterCTA";
import SellaHubExperience from "../components/SellaHubExperience";
import Listings from "../components/Listings";

const Home = () => {
  return (
    <div>
      <Hero />
      <Categories />
      <FeaturedListings />
      <Listings />
      <SellaHubExperience />
      <HowItWorks />
      <WhySell />
      <PricingPlans />
      <FooterCTA />
    </div>
  );
};

export default Home;
