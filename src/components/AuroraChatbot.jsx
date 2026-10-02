import { useState, useRef, useEffect } from "react";

import {
  FaMagic,
  FaTimes,
  FaPaperPlane,
  FaGavel,
  FaTag,
  FaClock,
  FaShieldAlt,
} from "react-icons/fa";

import "../styles/dashboard_home.css";


const API_BASE_URL = "http://127.0.0.1:8000";


function AuroraChatbot() {

  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text:
        "Hi there! 👋 I'm Aurora, your Bidora AI assistant. Ask me about your auctions, bids, or activity.",
    },
  ]);

  const messagesEndRef = useRef(null);


  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages, loading]);


  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async (customMessage = null) => {

    const text =
      customMessage !== null
        ? customMessage
        : message.trim();


    if (!text || loading) {
      return;
    }


    const userMessage = {
      id: Date.now(),
      type: "user",
      text,
    };


    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);


    setMessage("");

    setLoading(true);


    try {

      const token =
        sessionStorage.getItem(
          "access_token"
        );


      if (!token) {

        throw new Error(
          "Authentication required."
        );

      }


      const response = await fetch(
        `${API_BASE_URL}/api/aurora/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            message: text,
          }),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Aurora request failed."
        );

      }


      const botMessage = {
        id: Date.now() + 1,

        type: "bot",

        text:
          data.answer ||
          "I couldn't find an answer.",

        intent:
          data.intent,

        data:
          data.data || [],
      };


      setMessages((previous) => [
        ...previous,
        botMessage,
      ]);

    } catch (error) {

      console.error(
        "Aurora error:",
        error
      );


      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,

          type: "bot",

          text:
            "Sorry, I couldn't connect to the Bidora database right now. Please try again.",
        },
      ]);

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // ENTER KEY
  // =====================================================

  const handleKeyDown = (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }
  };


  // =====================================================
  // FORMAT DATABASE RESULTS
  // =====================================================

  const renderData = (messageItem) => {

    if (
      !messageItem.data ||
      messageItem.data.length === 0
    ) {
      return null;
    }


    return (
      <div className="aurora-result-list">

        {messageItem.data.map(
          (item, index) => (

            <div
              className="aurora-result-card"
              key={index}
            >

              <strong>
                {item.title}
              </strong>


              {item.category && (
                <span>
                  {item.category}
                </span>
              )}


              {item.my_bid && (
                <small>
                  Your highest bid:{" "}
                  <b>
                    {item.my_bid}
                  </b>
                </small>
              )}


              {item.current_high && (
                <small>
                  Current bid:{" "}
                  <b>
                    {item.current_high}
                  </b>
                </small>
              )}


              {item.current_bid && (
                <small>
                  Current bid:{" "}
                  <b>
                    {item.current_bid}
                  </b>
                </small>
              )}


              {item.starting_price && (
                <small>
                  Starting price:{" "}
                  <b>
                    {item.starting_price}
                  </b>
                </small>
              )}


              {item.highest_bid && (
                <small>
                  Highest bid:{" "}
                  <b>
                    {item.highest_bid}
                  </b>
                </small>
              )}


              {item.status && (
                <small>
                  Status:{" "}
                  <b>
                    {item.status}
                  </b>
                </small>
              )}


              {item.auction_status && (
                <small>
                  Auction:{" "}
                  <b>
                    {item.auction_status}
                  </b>
                </small>
              )}


              {item.ends && (
                <small>
                  Ends:{" "}
                  <b>
                    {item.ends}
                  </b>
                </small>
              )}

            </div>

          )
        )}

      </div>
    );
  };


  // =====================================================
  // QUICK QUESTIONS
  // =====================================================

  const quickQuestions = [
    {
      label: "My active bids",
      icon: <FaGavel />,
      text: "Show me my active bids",
    },

    {
      label: "Live auctions",
      icon: <FaTag />,
      text: "Show me live auctions",
    },

    {
      label: "Ending soon",
      icon: <FaClock />,
      text: "Show me auctions ending soon",
    },
  ];


  return (

    <div className="aurora-chatbot">


      {/* =================================================
          CHAT WINDOW
      ================================================= */}

      {open && (

        <div className="aurora-chat-window">


          {/* HEADER */}

          <div className="aurora-chat-header">

            <div className="aurora-chat-title">

              <div className="aurora-chat-avatar">
                <FaMagic />
              </div>

              <div>

                <strong>
                  Ask Aurora
                </strong>

                <span>
                  <i></i>
                  AI Auction Assistant
                </span>

              </div>

            </div>


            <button
              className="aurora-close-btn"
              onClick={() =>
                setOpen(false)
              }
            >
              <FaTimes />
            </button>

          </div>


          {/* =================================================
              MESSAGES
          ================================================= */}

          <div className="aurora-chat-messages">

            {messages.map(
              (item) => (

                <div
                  key={item.id}
                  className={
                    `aurora-message ${
                      item.type === "bot"
                        ? "aurora-bot-message"
                        : "aurora-user-message"
                    }`
                  }
                >

                  {item.type === "bot" && (

                    <div className="aurora-small-avatar">
                      <FaMagic />
                    </div>

                  )}


                  <div>

                    <div className="aurora-message-bubble">
                      {item.text}
                    </div>


                    {item.type === "bot" &&
                      renderData(item)}

                  </div>

                </div>

              )
            )}


            {loading && (

              <div className="aurora-message aurora-bot-message">

                <div className="aurora-small-avatar">
                  <FaMagic />
                </div>

                <div className="aurora-message-bubble">
                  Aurora is checking your Bidora database...
                </div>

              </div>

            )}


            <div ref={messagesEndRef} />

          </div>


          {/* =================================================
              QUICK QUESTIONS
          ================================================= */}

          <div className="aurora-quick-questions">

            {quickQuestions.map(
              (item) => (

                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    sendMessage(item.text)
                  }
                >

                  {item.icon}

                  {item.label}

                </button>

              )
            )}

          </div>


          {/* =================================================
              INPUT
          ================================================= */}

          <div className="aurora-chat-input-wrapper">

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask about auctions, bids..."
              rows={1}
              disabled={loading}
            />


            <button
              type="button"
              className="aurora-send-btn"
              onClick={() =>
                sendMessage()
              }
              disabled={
                loading ||
                !message.trim()
              }
            >
              <FaPaperPlane />
            </button>

          </div>


          {/* SECURITY NOTE */}

          <div className="aurora-security-note">

            <FaShieldAlt />

            Aurora only uses information
            available to your Bidora account.

          </div>

        </div>

      )}


      {/* =================================================
          FLOATING BUTTON
      ================================================= */}

      {!open && (

        <div className="aurora-floating-wrapper">

          <button
            className="aurora-ask-button"
            onClick={() =>
              setOpen(true)
            }
          >

            <FaMagic />

            Ask Aurora

          </button>


          <button
            className="aurora-floating-icon"
            onClick={() =>
              setOpen(true)
            }
            aria-label="Open Aurora"
          >

            <div className="aurora-glow"></div>

            <div className="aurora-orb">
              <FaMagic />
            </div>

          </button>

        </div>

      )}

    </div>
  );
}


export default AuroraChatbot;