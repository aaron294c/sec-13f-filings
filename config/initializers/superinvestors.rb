# Superinvestor Configuration
# This file maintains the list of "superinvestors" whose holdings are aggregated
# for portfolio statistics and analysis.
#
# Top 100 managers by portfolio value (Q1 2025)

# Dynamically load all Q1 2025 managers with portfolios > $500M
SUPERINVESTORS = begin
  filings = ThirteenF.
    where(report_year: 2025, report_quarter: 1).
    processed.
    exclude_restated.
    where('holdings_value_calculated > 500000000').
    order(holdings_value_calculated: :desc).
    limit(100)

  filings.map do |f|
    investor_name = f.name.
      gsub(/\s+(LLC|LP|L\.P\.|INC|CORP|LTD|LIMITED|PARTNERS|CAPITAL|MANAGEMENT|ADVISORS|ADVISOR|FUND|FUNDS|ASSET|INVESTMENTS|GROUP|TRUST|CO)\s*$/i, '').
      strip

    {
      cik: f.cik,
      name: f.name,
      investor: investor_name
    }
  end
rescue => e
  # Fallback to top 14 if database not available yet
  [
    { cik: '0000102909', name: 'VANGUARD GROUP INC', investor: 'Vanguard Group' },
    { cik: '0001067983', name: 'BERKSHIRE HATHAWAY INC', investor: 'Berkshire Hathaway (Warren Buffett)' },
    { cik: '0001037389', name: 'RENAISSANCE TECHNOLOGIES LLC', investor: 'Renaissance Technologies' },
    { cik: '0001603466', name: 'Point72 Asset Management, L.P.', investor: 'Point72 (Steve Cohen)' },
    { cik: '0001166559', name: 'GATES FOUNDATION TRUST', investor: 'Bill & Melinda Gates Foundation' },
    { cik: '0001167483', name: 'TIGER GLOBAL MANAGEMENT LLC', investor: 'Tiger Global (Chase Coleman)' },
    { cik: '0001350694', name: 'Bridgewater Associates, LP', investor: 'Bridgewater (Ray Dalio)' },
    { cik: '0001061165', name: 'LONE PINE CAPITAL LLC', investor: 'Lone Pine (Stephen Mandel)' },
    { cik: '0001336528', name: 'Pershing Square Capital Management, L.P.', investor: 'Pershing Square (Bill Ackman)' },
    { cik: '0001029160', name: 'SOROS FUND MANAGEMENT LLC', investor: 'Soros Fund Management' },
    { cik: '0001040273', name: 'Third Point LLC', investor: 'Third Point (Daniel Loeb)' },
    { cik: '0000915191', name: 'FAIRFAX FINANCIAL HOLDINGS LTD/ CAN', investor: 'Fairfax Financial (Prem Watsa)' },
    { cik: '0001649339', name: 'Scion Asset Management, LLC', investor: 'Scion (Michael Burry)' },
    { cik: '0001061768', name: 'BAUPOST GROUP LLC/MA', investor: 'Baupost Group (Seth Klarman)' },
  ]
end.freeze

# Return all superinvestor CIKs
def superinvestor_ciks
  SUPERINVESTORS.map { |s| s[:cik] }
end

# Return superinvestor data by CIK
def superinvestor_by_cik(cik)
  SUPERINVESTORS.find { |s| s[:cik] == cik }
end
