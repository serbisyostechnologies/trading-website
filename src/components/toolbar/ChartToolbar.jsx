import { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Radio,
  Crosshair,
  MoreVertical,
  Settings2,
  Clock,
  ChartCandlestick,
} from "lucide-react";
import "./ChartToolbar.css";

export default function ChartToolbar({
  chartRef,
  instrument,
  setInstrument,
  interval,
  setInterval,
  chartType,
  setChartType,
  INSTRUMENTS = [],
  TIME_INTERVALS = [],
  CHART_TYPES = [],
}) {
  const [crosshairEnabled, setCrosshairEnabled] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSetting, setActiveSetting] = useState(null);

  const toolbarRef = useRef(null);

  const getChart = () => chartRef?.current;

  useEffect(() => {
    const handlePointerDown = (event) => {
      const toolbar = toolbarRef.current;

      if (!toolbar || toolbar.contains(event.target)) {
        return;
      }

      setMenuOpen(false);
      setActiveSetting(null);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setActiveSetting(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const zoom = (direction) => {
    const timeScale = getChart()?.timeScale();
    const range = timeScale?.getVisibleLogicalRange();

    if (!range) return;

    const center = (range.from + range.to) / 2;
    const halfRange = (range.to - range.from) / 2;
    const factor = direction === "in" ? 0.8 : 1.25;

    timeScale.setVisibleLogicalRange({
      from: center - halfRange * factor,
      to: center + halfRange * factor,
    });
  };

  const fitChart = () => getChart()?.timeScale().fitContent();
  const goToLive = () => getChart()?.timeScale().scrollToRealTime();

  const toggleCrosshair = () => {
    const chart = getChart();
    if (!chart) return;

    const enabled = !crosshairEnabled;

    chart.applyOptions({
      crosshair: {
        vertLine: { visible: enabled },
        horzLine: { visible: enabled },
      },
    });

    setCrosshairEnabled(enabled);
  };

  const chartActions = [
    { label: "Zoom In", icon: ZoomIn, run: () => zoom("in") },
    { label: "Zoom Out", icon: ZoomOut, run: () => zoom("out") },
    { label: "Fit Chart", icon: Maximize, run: fitChart },
    { label: "Go Live", icon: Radio, run: goToLive, live: true },
    {
      label: "Crosshair",
      icon: Crosshair,
      run: toggleCrosshair,
      active: crosshairEnabled,
    },
  ];

  const settings = [
    {
      key: "instrument",
      label: "Instrument",
      icon: Settings2,
      value: instrument ?? "",
      onChange: setInstrument,
      options: INSTRUMENTS.map((item) => ({
        value: item.symbol,
        label: item.label,
      })),
    },
    {
      key: "interval",
      label: "Time Interval",
      icon: Clock,
      value: String(interval ?? ""),
      onChange: (value) => setInterval(value),
      options: TIME_INTERVALS.map((item) => ({
        value: item.id,
        label: item.label,
      })),
    },
    {
      key: "chartType",
      label: "Chart Style",
      icon: ChartCandlestick,
      value: chartType ?? "",
      onChange: setChartType,
      options: CHART_TYPES.map((item) => ({
        value: item.value,
        label: item.label,
      })),
    },
  ];

  const toggleSetting = (key) => {
    setActiveSetting((current) => (current === key ? null : key));
  };

  const renderChartAction = (action, mobile = false) => {
    const Icon = action.icon;

    return (
      <button
        key={action.label}
        type="button"
        title={action.label}
        aria-label={action.label}
        aria-pressed={
          action.label === "Crosshair" ? crosshairEnabled : undefined
        }
        className={[
          mobile ? "chart-popup-icon" : "chart-action-button",
          action.active ? "tool-active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => {
          action.run();

          if (mobile) {
            setMenuOpen(false);
            setActiveSetting(null);
          }
        }}
      >
        <Icon size={18} className={action.live ? "chart-live-icon" : ""} />
      </button>
    );
  };

  const renderSettingDropdown = (setting, mobile = false) => (
    <div
      className={`chart-setting-dropdown ${
        mobile ? "chart-setting-dropdown-mobile" : ""
      }`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <label htmlFor={`toolbar-${setting.key}`}>{setting.label}</label>
      <select
        id={`toolbar-${setting.key}`}
        aria-label={setting.label}
        value={setting.value}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          setting.onChange(event.target.value);
          setActiveSetting(null);

          // Keep the mobile three-dot menu open.
          // The user can continue using other toolbar icons.
        }}
      >
        {setting.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <header className="chart-toolbar-tools" ref={toolbarRef}>
      <div className="chart-toolbar-brand">
        <img
          src="/favicon.png"
          alt="SerbisyosTickStream logo"
          className="chart-toolbar-logo"
        />
        <span className="chart-toolbar-app-name">SerbisyosTickStream</span>
      </div>

      <div className="chart-toolbar-actions">
        {/* Desktop chart actions */}
        <div className="chart-desktop-actions">
          {chartActions.map((action) => renderChartAction(action))}
        </div>

        {/* Desktop settings */}
        <div className="chart-desktop-settings">
          {settings.map((setting) => {
            const Icon = setting.icon;

            return (
              <div className="chart-setting-item" key={setting.key}>
                <button
                  type="button"
                  title={setting.label}
                  aria-label={setting.label}
                  aria-expanded={activeSetting === setting.key}
                  className={`chart-action-button ${
                    activeSetting === setting.key ? "tool-active" : ""
                  }`}
                  onClick={() => toggleSetting(setting.key)}
                >
                  <Icon size={18} />
                </button>

                {activeSetting === setting.key &&
                  renderSettingDropdown(setting)}
              </div>
            );
          })}
        </div>

        {/* Mobile three-dot menu */}
        <div className="chart-mobile-menu">
          <button
            type="button"
            className="chart-menu-trigger"
            title="Chart tools"
            aria-label="Open chart tools"
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((open) => !open);
              setActiveSetting(null);
            }}
          >
            <MoreVertical size={22} />
          </button>

          {menuOpen && (
            <div
              className="chart-icon-popup"
              onPointerDown={(event) => event.stopPropagation()}
            >
              {chartActions.map((action) => renderChartAction(action, true))}
              {settings.map((setting) => {
                const Icon = setting.icon;
                const isActive = activeSetting === setting.key;

                return (
                  <div
                    className={`chart-mobile-setting-item ${
                      isActive ? "setting-open" : ""
                    }`}
                    key={setting.key}
                  >
                    <button
                      type="button"
                      title={setting.label}
                      aria-label={setting.label}
                      aria-expanded={isActive}
                      className={`chart-popup-icon ${
                        isActive ? "tool-active" : ""
                      }`}
                      onClick={() => toggleSetting(setting.key)}
                    >
                      <Icon size={18} />
                    </button>

                    {/* Dropdown appears directly below its icon */}
                    {isActive && renderSettingDropdown(setting, true)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}