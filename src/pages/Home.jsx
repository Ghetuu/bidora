import Navbar from "../components/Navbar";
import heroImage from "../assets/images/bidora-image.jpg";
import "../components/Hero.css";

function Home() {
  return (
    <>
      <Navbar />

      <section className="hero">

        <div className="hero-content">

          <span className="hero-badge">
            🔨 Live Auctions
          </span>

          <h1>
            Bid on unique items
            <br />
            in real time.
          </h1>

          <p>
            Join live auctions, track bids as they happen,
            and list your own treasures for the world to discover.
          </p>

          <div className="hero-buttons">

            <button className="primary-btn">
              Browse Auctions
            </button>

            <button className="secondary-btn">
              Get Started
            </button>

          </div>

        </div>

        <div className="hero-image">

          <img
            src={heroImage}
            alt="Auction Gavel"
          />

        </div>

      </section>

    </>
  );
}

export default Home;