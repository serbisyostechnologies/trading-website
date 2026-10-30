import "./LiveMarketChart.css";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  createChart,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  ColorType,
} from "lightweight-charts";
import ChartToolbar from "../toolbar/ChartToolbar";

const INSTRUMENTS = [
  {
    symbol: "BHARTIARTL",
    exchangeSegment: "NSE_EQ",
    securityId: "10604",
    label: "Bharti Airtel",
  },
  {
    symbol: "HDFCBANK",
    exchangeSegment: "NSE_EQ",
    securityId: "1330",
    label: "HDFC Bank",
  },
  {
    symbol: "ICICIBANK",
    exchangeSegment: "NSE_EQ",
    securityId: "4963",
    label: "ICICI Bank",
  },
  {
    symbol: "INFY",
    exchangeSegment: "NSE_EQ",
    securityId: "1594",
    label: "Infosys",
  },
  {
    symbol: "NIFTY",
    exchangeSegment: "IDX_I",
    securityId: "13",
    label: "NIFTY 50",
  },
  {
    symbol: "BANKNIFTY",
    exchangeSegment: "IDX_I",
    securityId: "25",
    label: "NIFTY Bank",
  },
  {
    symbol: "FINNIFTY",
    exchangeSegment: "IDX_I",
    securityId: "27",
    label: "NIFTY Financial Services",
  },
  {
    symbol: "RELIANCE",
    exchangeSegment: "NSE_EQ",
    securityId: "1333",
    label: "Reliance Industries",
  },
  {
    symbol: "SBIN",
    exchangeSegment: "NSE_EQ",
    securityId: "3045",
    label: "State Bank of India",
  },
  {
    symbol: "TCS",
    exchangeSegment: "NSE_EQ",
    securityId: "11536",
    label: "Tata Consultancy Services",
  },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CHART_TYPES = [
  { value: "candlestick", label: "Candles" },
  { value: "bar", label: "OHLC Bars" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "baseline", label: "Baseline" },
];

const TIME_INTERVALS = [
  { id: "1s", label: "1 Second", value: 1, unit: "second", seconds: 1 },
  { id: "5s", label: "5 Seconds", value: 5, unit: "second", seconds: 5 },
  { id: "10s", label: "10 Seconds", value: 10, unit: "second", seconds: 10 },
  { id: "15s", label: "15 Seconds", value: 15, unit: "second", seconds: 15 },
  { id: "30s", label: "30 Seconds", value: 30, unit: "second", seconds: 30 },
  { id: "1m", label: "1 Minute", value: 1, unit: "minute", seconds: 60 },
  { id: "3m", label: "3 Minutes", value: 3, unit: "minute", seconds: 180 },
  { id: "5m", label: "5 Minutes", value: 5, unit: "minute", seconds: 300 },
  { id: "10m", label: "10 Minutes", value: 10, unit: "minute", seconds: 600 },
  { id: "15m", label: "15 Minutes", value: 15, unit: "minute", seconds: 900 },
  { id: "30m", label: "30 Minutes", value: 30, unit: "minute", seconds: 1800 },
  { id: "45m", label: "45 Minutes", value: 45, unit: "minute", seconds: 2700 },
  { id: "1h", label: "1 Hour", value: 1, unit: "hour", seconds: 3600 },
  { id: "2h", label: "2 Hours", value: 2, unit: "hour", seconds: 7200 },
  { id: "4h", label: "4 Hours", value: 4, unit: "hour", seconds: 14400 },
  { id: "1d", label: "1 Day", value: 1, unit: "day", seconds: 86400 },
  { id: "1w", label: "1 Week", value: 1, unit: "week", seconds: 604800 },
  { id: "1mo", label: "1 Month", value: 1, unit: "month", seconds: 2628000 },
  { id: "3mo", label: "3 Months", value: 3, unit: "month", seconds: 7884000 },
  { id: "6mo", label: "6 Months", value: 6, unit: "month", seconds: 15770000 },
  { id: "1y", label: "1 Year", value: 1, unit: "year", seconds: 31540000 },
];

const toSeriesData = (candles, type) => {
  if (type === "line" || type === "area" || type === "baseline") {
    return candles.map(({ time, close }) => ({
      time,
      value: close,
    }));
  }

  return candles.map(({ time, open, high, low, close }) => ({
    time,
    open,
    high,
    low,
    close,
  }));
};

const getSeriesOptions = (type) => {
  const common = {
    priceLineVisible: true,
    lastValueVisible: true,
  };

  switch (type) {
    case "bar":
      return {
        type: BarSeries,
        options: {
          ...common,
          upColor: "#22c55e",
          downColor: "#ef4444",
          openVisible: true,
          thinBars: false,
        },
      };

    case "line":
      return {
        type: LineSeries,
        options: {
          ...common,
          color: "#38bdf8",
          lineWidth: 2,
          crosshairMarkerVisible: true,
        },
      };

    case "area":
      return {
        type: AreaSeries,
        options: {
          ...common,
          lineColor: "#38bdf8",
          topColor: "rgba(56,189,248,0.35)",
          bottomColor: "rgba(56,189,248,0.02)",
          lineWidth: 2,
        },
      };

    case "baseline":
      return {
        type: BaselineSeries,
        options: {
          ...common,
          baseValue: { type: "price", price: 0 },
          topLineColor: "#22c55e",
          topFillColor1: "rgba(34,197,94,0.25)",
          topFillColor2: "rgba(34,197,94,0.02)",
          bottomLineColor: "#ef4444",
          bottomFillColor1: "rgba(239,68,68,0.02)",
          bottomFillColor2: "rgba(239,68,68,0.25)",
        },
      };

    default:
      return {
        type: CandlestickSeries,
        options: {
          ...common,
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderVisible: false,
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        },
      };
  }
};

export default function LiveMarketChart({ symbol = "NIFTY", authToken }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const candlesRef = useRef([]);

  const [chartType, setChartType] = useState("candlestick");
  const [instrument, setInstrument] = useState("NIFTY");
  const [interval, setInterval] = useState("1s");
  const [status, setStatus] = useState("Connecting...");
  const [tick, setTick] = useState(null);
  const [error, setError] = useState("");

  // Create the chart once.
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "#0b1220",
        },
        textColor: "#cbd5e1",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      rightPriceScale: {
        borderColor: "#334155",
        autoScale: true,
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      crosshair: {
        vertLine: { color: "#64748b" },
        horzLine: { color: "#64748b" },
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Replace the series when the user changes chart style.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    const config = getSeriesOptions(chartType);
    const series = chart.addSeries(config.type, config.options);

    seriesRef.current = series;

    series.setData(toSeriesData(candlesRef.current, chartType));

    return undefined;
  }, [chartType]);

  // One Socket.IO connection for this chart component.
  useEffect(() => {
    if (!instrument) return;

    setError("");
    setStatus("Connecting...");
    candlesRef.current = [];
    setTick(null);

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      auth: authToken ? { token: authToken } : {},
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      setStatus("Connected");

      socket.emit(
        "market:subscribe",
        {
          symbol: instrument,
          mode: "ticker",
          interval,
        },
        (response) => {
          if (!response?.ok) {
            setError(response?.error || "Market subscription failed");
            return;
          }

          const history = response.candles || [];

          candlesRef.current = history;
          seriesRef.current?.setData(toSeriesData(history, chartType));

          chartRef.current?.timeScale().fitContent();

          if (response.lastTick) {
            setTick(response.lastTick);
          }
        },
      );
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    socket.on("connect_error", (err) => {
      setStatus("Error");
      setError(err.message || "Socket connection failed");
    });

    socket.on("market:status", (data) => {
      if (data?.state) setStatus(capitalizeFirst(data.state));
    });

    socket.on("market:tick", (data) => {
      if (data.symbol === instrument) {
        setTick(data);
      }
    });

    socket.on("market:candle", (candle) => {
      const candles = candlesRef.current;
      const last = candles[candles.length - 1];

      // Update the current candle, or append a new one.
      if (last && last.time === candle.time) {
        candles[candles.length - 1] = candle;
      } else if (!last || candle.time > last.time) {
        candles.push(candle);

        if (candles.length > 1500) {
          candles.shift();
        }
      } else {
        // Ignore out-of-order candle updates.
        return;
      }

      const series = seriesRef.current;
      if (!series) return;

      if (
        chartType === "line" ||
        chartType === "area" ||
        chartType === "baseline"
      ) {
        series.update({
          time: candle.time,
          value: candle.close,
        });
      } else {
        series.update({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      }
    });

    return () => {
      socket.emit("market:unsubscribe", { symbol: instrument });
      socket.disconnect();
    };
  }, [instrument, authToken, interval]);

  const formatPrice = (value) =>
    Number.isFinite(value)
      ? value.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";

  const getInstrumentName = (instrumentSymbol) => {
    const value = INSTRUMENTS.filter(
      (item) => item.symbol === instrumentSymbol,
    );
    return value[0].label;
  };

  const getTimeInterval = () => {
    const selectedInterval = TIME_INTERVALS.find(
      (item) => item.id === interval,
    );
    return selectedInterval.label;
  };

  const capitalizeFirst = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="market-screen">
      <ChartToolbar
        chartRef={chartRef}
        instrument={instrument}
        setInstrument={setInstrument}
        interval={interval}
        setInterval={setInterval}
        chartType={chartType}
        setChartType={setChartType}
        INSTRUMENTS={INSTRUMENTS}
        TIME_INTERVALS={TIME_INTERVALS}
        CHART_TYPES={CHART_TYPES}
      />
      <section className="live-market-chart">
        <div className="chart-toolbar">
          <div className="chart-instrument">
            <strong>{getInstrumentName(instrument)}</strong>
            <span className={`feed-status ${status}`}>{status}</span>
          </div>

          <div className="chart-price">
            <strong>{formatPrice(tick?.ltp)}</strong>
            <span>
              {tick?.receivedAt
                ? new Date(tick.receivedAt).toLocaleTimeString()
                : "Waiting for ticks"}
            </span>
          </div>
        </div>

        {error && (
          <div className="chart-error" role="alert">
            {error}
          </div>
        )}

        <div ref={containerRef} className="chart-canvas" />

        <div className="chart-footer">
          <span>Live market data</span>
          <span>{getTimeInterval(interval)} candles</span>
          <button
            type="button"
            onClick={() => chartRef.current?.timeScale().fitContent()}
          >
            Fit chart
          </button>
        </div>
      </section>
    </div>
  );
}