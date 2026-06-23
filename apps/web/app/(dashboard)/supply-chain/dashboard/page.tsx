"use client";

import React from 'react';
import ReactECharts from 'echarts-for-react';

export default function SupplyChainDashboard() {
  const forecastOptions = {
    title: {
      text: 'AI Inventory Depletion Forecast (Next 30 Days)',
      left: 'center',
      textStyle: {
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Predicted Demand', 'Confidence Interval'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({length: 30}, (_, i) => `Day ${i+1}`)
    },
    yAxis: {
      type: 'value',
      name: 'Units'
    },
    series: [
      {
        name: 'Confidence Interval',
        type: 'line',
        data: Array.from({length: 30}, (_, i) => 15 - (i * 0.1) + 2), // Mock High
        lineStyle: { opacity: 0 },
        areaStyle: { color: '#e0e0e0', opacity: 0.5 },
        stack: 'confidence'
      },
      {
        name: 'Predicted Demand',
        type: 'line',
        smooth: true,
        data: Array.from({length: 30}, (_, i) => 15 - (i * 0.1)), // Mock trend
        itemStyle: { color: '#2563eb' }
      }
    ]
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Supply Chain & AI Analytics</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Pending POs</h3>
          <p className="text-3xl font-bold mt-2">12</p>
        </div>
        <div className="bg-background border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Low Stock Alerts</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">4</p>
        </div>
        <div className="bg-background border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">AI Reorder Accuracy</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">94.2%</p>
        </div>
      </div>

      <div className="bg-background border rounded-lg p-6 shadow-sm w-full h-[500px]">
        <ReactECharts option={forecastOptions} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}
