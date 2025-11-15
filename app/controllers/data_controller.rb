class DataController < ApplicationController
  before_action :set_public_cache_header

  def autocomplete
    managers_data = ThirteenFFiler.
      autocomplete(params[:q]).
      limit(8).
      map do |f|
        {
          cik: f.cik,
          name: f.name,
          extra: "#{f.city_and_state}",
          path: "/manager/#{f.cik}"
        }
      end

    cusips_data = CompanyCusipLookup.
      autocomplete(params[:q]).
      limit(5).
      map do |c|
        {
          cusip: c.cusip,
          name: c.issuer_name,
          extra: [c.symbol, c.cusip, c.class_title.upcase].compact.join(" - "),
          path: "/cusip/#{c.cusip}"
        }
      end

    render json: {managers: managers_data, cusips: cusips_data}
  end

  def thirteen_f_data
    filing = ThirteenF.without_xml_fields.find_by!(external_id: params[:external_id])

    holdings = filing.aggregate_holdings.descend_by_value.map do |h|
      pct_of_total = if h.value
        100 * h.value.to_f / filing.holdings_value_calculated.to_f
      end

      {
        issuer_name: h.issuer_name,
        class_title: h.class_title&.upcase,
        cusip: h.cusip,
        value: h.value&.to_i,
        pct: pct_of_total&.round(1),
        shares: h.shares&.to_i,
        principal: h.principal&.to_i,
        option_type: h.option_type
      }
    end

    render json: {
      filing: {
        external_id: filing.external_id,
        cik: filing.cik,
        manager_name: filing.name,
        report_date: filing.report_date,
        report_year: filing.report_year,
        report_quarter: filing.report_quarter,
        total_value: filing.holdings_value_calculated,
        period: "Q#{filing.report_quarter} #{filing.report_year}"
      },
      data: holdings
    }
  end

  def thirteen_f_detailed_data
    filing = ThirteenF.without_xml_fields.find_by!(external_id: params[:external_id])

    holdings = filing.holdings.descend_by_value.map do |h|
      pct_of_total = if h.value
        100 * h.value.to_f / filing.holdings_value_calculated.to_f
      end

      {
        issuer_name: h.issuer_name,
        class_title: h.class_title&.upcase,
        cusip: h.cusip,
        value: h.value&.to_i,
        pct: pct_of_total&.round(1),
        shares: h.shares&.to_i,
        principal: h.principal&.to_i,
        option_type: h.option_type,
        investment_discretion: h.investment_discretion,
        other_manager: h.other_manager,
        voting_authority_sole: h.voting_authority_sole&.to_i,
        voting_authority_shared: h.voting_authority_shared&.to_i,
        voting_authority_none: h.voting_authority_none&.to_i
      }
    end

    render json: {
      filing: {
        external_id: filing.external_id,
        cik: filing.cik,
        manager_name: filing.name,
        report_date: filing.report_date,
        report_year: filing.report_year,
        report_quarter: filing.report_quarter,
        total_value: filing.holdings_value_calculated,
        period: "Q#{filing.report_quarter} #{filing.report_year}"
      },
      data: holdings
    }
  end

  def compare_holdings_data
    filing = ThirteenF.without_xml_fields.find_by!(external_id: params[:external_id])
    other_filing = ThirteenF.without_xml_fields.find_by!(external_id: params[:other_external_id])
    render json: DataTableFormatter.thirteen_f_comparison_to_datatable(filing, other_filing)
  end

  def all_cusip_holders_data
    year = params[:year].to_i
    quarter = params[:quarter].to_i

    head :bad_request unless (1..4).include?(quarter) && year <= Date.today.year

    data = DataTableFormatter.all_cusip_holdings_to_datatable(
      cusip: parsed_cusip,
      year: year,
      quarter: quarter
    )

    render json: data
  end

  def manager_cusip_history_data
    data = DataTableFormatter.manager_cusip_history_to_datatable(
      cusip: parsed_cusip,
      manager_cik: params[:cik]
    )

    render json: data
  end

  def managers_list
    page = params[:page] || 1
    per_page = params[:per_page] || 50
    search = params[:search]

    # Get all filer CIKs that have processed filings
    filers_with_filings = ThirteenF.processed.distinct.pluck(:cik)

    filers = ThirteenFFiler.
      where(cik: filers_with_filings)

    # Apply search filter if provided
    if search.present?
      filers = filers.where("name ILIKE ?", "%#{search}%")
    end

    filers = filers.
      order("lower(name), cik").
      page(page).
      per(per_page)

    render json: {
      managers: filers.map { |f|
        {
          cik: f.cik,
          name: f.name,
          city: f.city,
          state: f.state_or_country,
          location: f.city_and_state,
          path: "/manager/#{f.cik}"
        }
      },
      pagination: {
        current_page: filers.current_page,
        total_pages: filers.total_pages,
        total_count: filers.total_count,
        per_page: per_page.to_i
      }
    }
  end

  def newest_filings_data
    # Show top 100 filings by portfolio value for the specified quarter
    # Default to Q2 2025 if no parameters provided
    year = params[:year]&.to_i || 2025
    quarter = params[:quarter]&.to_i || 2

    filings = ThirteenF.
      where(report_year: year, report_quarter: quarter).
      processed.
      without_xml_fields.
      includes(:filer).
      order(holdings_value_calculated: :desc, date_filed: :desc).
      page(params[:page] || 1).
      per(params[:per_page] || 100)

    render json: {
      filings: filings.map { |f|
        {
          external_id: f.external_id,
          cik: f.cik,
          manager_name: f.name,
          report_date: f.report_date,
          report_year: f.report_year,
          report_quarter: f.report_quarter,
          date_filed: f.date_filed,
          form_type: f.form_type,
          amendment_type: f.amendment_type,
          holdings_count: f.holdings_count_calculated,
          holdings_value: f.holdings_value_calculated,
          path: "/13f/#{f.external_id}"
        }
      },
      pagination: {
        current_page: filings.current_page,
        total_pages: filings.total_pages,
        total_count: filings.total_count
      }
    }
  end

  def manager_filings_data
    filer = ThirteenFFiler.find_by!(cik: params[:cik])

    filings = filer.
      thirteen_fs.
      without_xml_fields.
      most_recent.
      page(params[:page] || 1).
      per(params[:per_page] || 50)

    render json: {
      manager: {
        cik: filer.cik,
        name: filer.name,
        location: filer.city_and_state
      },
      filings: filings.map { |f|
        {
          external_id: f.external_id,
          report_date: f.report_date,
          report_year: f.report_year,
          report_quarter: f.report_quarter,
          date_filed: f.date_filed,
          form_type: f.form_type,
          amendment_type: f.amendment_type,
          holdings_count: f.holdings_count_calculated,
          holdings_value: f.holdings_value_calculated,
          path: "/13f/#{f.external_id}"
        }
      },
      pagination: {
        current_page: filings.current_page,
        total_pages: filings.total_pages,
        total_count: filings.total_count
      }
    }
  end

  def superinvestor_stats
    year = params[:year]&.to_i
    quarter = params[:quarter]&.to_i

    # Get Q3 2025 stats - dynamically load top 100 managers
    q3_year = 2025
    q3_quarter = 3
    q3_ciks = ThirteenF.
      where(report_year: q3_year, report_quarter: q3_quarter).
      processed.
      exclude_restated.
      where('holdings_value_calculated > 500000000').
      order(holdings_value_calculated: :desc).
      limit(100).
      pluck(:cik).
      uniq

    q3_service = SuperinvestorStatsService.new(year: q3_year, quarter: q3_quarter, superinvestor_ciks: q3_ciks)

    # Get Q2 2025 stats - dynamically load top 100 managers
    q2_year = 2025
    q2_quarter = 2
    q2_ciks = ThirteenF.
      where(report_year: q2_year, report_quarter: q2_quarter).
      processed.
      exclude_restated.
      where('holdings_value_calculated > 500000000').
      order(holdings_value_calculated: :desc).
      limit(100).
      pluck(:cik).
      uniq

    q2_service = SuperinvestorStatsService.new(year: q2_year, quarter: q2_quarter, superinvestor_ciks: q2_ciks)

    # Compare Q3 vs Q2
    q3_stats_with_comparison = q3_service.compare_periods(q3_year, q3_quarter, q2_year, q2_quarter)

    render json: {
      periods: {
        current: { year: q3_year, quarter: q3_quarter, manager_count: q3_ciks.count },
        comparison: { year: q2_year, quarter: q2_quarter, manager_count: q2_ciks.count }
      },
      q3_data: {
        superinvestors: q3_service.superinvestors_list,
        stats: {
          top_owned: q3_stats_with_comparison[:top_owned],
          top_by_pct: q3_stats_with_comparison[:top_by_pct],
          big_bets: q3_stats_with_comparison[:big_bets],
          top_buys_1q: q3_service.top_buys_last_quarter,
          top_buys_1q_pct: q3_service.top_buys_last_quarter_by_pct,
          top_sells_1q: q3_service.top_sells_last_quarter,
          top_sells_1q_pct: q3_service.top_sells_last_quarter_by_pct,
          top_buys_2q: q3_service.top_buys_last_two_quarters,
          top_buys_2q_pct: q3_service.top_buys_last_two_quarters_by_pct
        }
      },
      q2_data: {
        superinvestors: q2_service.superinvestors_list,
        stats: {
          top_owned: q2_service.top_stocks_by_ownership_count,
          top_by_pct: q2_service.top_stocks_by_aggregate_percentage,
          big_bets: q2_service.top_big_bets
        }
      }
    }
  end

  def grand_portfolio_data
    # Get Q3 2025 superinvestors for grand portfolio
    q3_year = 2025
    q3_quarter = 3
    q3_ciks = ThirteenF.
      where(report_year: q3_year, report_quarter: q3_quarter).
      processed.
      exclude_restated.
      where('holdings_value_calculated > 500000000').
      order(holdings_value_calculated: :desc).
      limit(100).
      pluck(:cik).
      uniq

    # Also get Q2 for comparison
    q2_year = 2025
    q2_quarter = 2
    q2_ciks = ThirteenF.
      where(report_year: q2_year, report_quarter: q2_quarter).
      processed.
      exclude_restated.
      where('holdings_value_calculated > 500000000').
      order(holdings_value_calculated: :desc).
      limit(100).
      pluck(:cik).
      uniq

    # Create service for Q3
    q3_service = GrandPortfolioService.new(
      year: q3_year,
      quarter: q3_quarter,
      superinvestor_ciks: q3_ciks
    )

    # Get consensus holdings
    consensus = q3_service.consensus_holdings
    top_by_value = q3_service.top_holdings_by_value
    top_conviction = q3_service.top_conviction_holdings
    emerging = q3_service.emerging_consensus(prev_year: q2_year, prev_quarter: q2_quarter)
    fading = q3_service.fading_consensus(prev_year: q2_year, prev_quarter: q2_quarter)
    stats = q3_service.portfolio_stats

    render json: {
      period: {
        year: q3_year,
        quarter: q3_quarter,
        manager_count: q3_ciks.count
      },
      stats: stats,
      consensus_holdings: consensus,
      top_by_value: top_by_value,
      top_conviction: top_conviction,
      emerging_consensus: emerging,
      fading_consensus: fading
    }
  end

  def manager_portfolio_data
    # Get individual manager's portfolio with quarter-over-quarter changes
    cik = params[:cik]

    return render json: { error: 'CIK parameter required' }, status: 400 if cik.blank?

    # Get manager info and their Q3 2025 filing
    q3_filing = ThirteenF.
      where(cik: cik, report_year: 2025, report_quarter: 3).
      processed.
      exclude_restated.
      order(date_filed: :desc).
      first

    return render json: { error: 'Manager not found or no Q3 2025 filing' }, status: 404 unless q3_filing

    # Get manager info
    manager = {
      cik: q3_filing.cik,
      name: q3_filing.name,
      report_date: q3_filing.report_date,
      date_filed: q3_filing.date_filed,
      portfolio_value: q3_filing.holdings_value_calculated,
      holdings_count: q3_filing.holdings_count_calculated
    }

    # Get Q3 holdings (current quarter)
    q3_holdings = q3_filing.aggregate_holdings.includes(:cusip_symbol_mapping).map do |h|
      {
        ticker: h.cusip_symbol_mapping&.symbol || h.cusip,
        cusip: h.cusip,
        issuer_name: h.issuer_name,
        shares: h.shares_or_principal_amount,
        value: h.value,
        percent_of_portfolio: (h.value.to_f / q3_filing.holdings_value_calculated * 100).round(2)
      }
    end

    # Get Q2 2025 filing for comparison
    q2_filing = ThirteenF.
      where(cik: cik, report_year: 2025, report_quarter: 2).
      processed.
      exclude_restated.
      order(date_filed: :desc).
      first

    # Calculate quarter-over-quarter changes
    if q2_filing
      q2_holdings_map = {}
      q2_filing.aggregate_holdings.each do |h|
        ticker = h.cusip_symbol_mapping&.symbol || h.cusip
        q2_holdings_map[ticker] = {
          shares: h.shares_or_principal_amount,
          value: h.value
        }
      end

      # Add change indicators to Q3 holdings
      q3_holdings.each do |holding|
        ticker = holding[:ticker]
        q2_data = q2_holdings_map[ticker]

        if q2_data.nil?
          # New position
          holding[:activity] = 'new'
          holding[:change_shares] = holding[:shares]
          holding[:change_value] = holding[:value]
        else
          # Existing position - check if increased or decreased
          shares_change = holding[:shares] - q2_data[:shares]
          value_change = holding[:value] - q2_data[:value]

          if shares_change > 0
            holding[:activity] = 'increased'
          elsif shares_change < 0
            holding[:activity] = 'decreased'
          else
            holding[:activity] = 'unchanged'
          end

          holding[:change_shares] = shares_change
          holding[:change_value] = value_change
          holding[:change_percent] = q2_data[:shares] > 0 ? ((shares_change.to_f / q2_data[:shares]) * 100).round(2) : nil
        end
      end

      # Find sold positions (in Q2 but not in Q3)
      q2_tickers = q2_holdings_map.keys
      q3_tickers = q3_holdings.map { |h| h[:ticker] }
      sold_tickers = q2_tickers - q3_tickers

      sold_holdings = sold_tickers.map do |ticker|
        q2_data = q2_holdings_map[ticker]
        q2_holding = q2_filing.aggregate_holdings.find do |h|
          (h.cusip_symbol_mapping&.symbol || h.cusip) == ticker
        end

        {
          ticker: ticker,
          cusip: q2_holding.cusip,
          issuer_name: q2_holding.issuer_name,
          shares: 0,
          value: 0,
          percent_of_portfolio: 0,
          activity: 'sold',
          change_shares: -q2_data[:shares],
          change_value: -q2_data[:value],
          prev_shares: q2_data[:shares],
          prev_value: q2_data[:value]
        }
      end

      # Combine holdings and sold positions
      all_holdings = q3_holdings + sold_holdings
    else
      # No Q2 data - mark everything as new
      q3_holdings.each do |holding|
        holding[:activity] = 'new'
        holding[:change_shares] = holding[:shares]
        holding[:change_value] = holding[:value]
      end
      all_holdings = q3_holdings
    end

    # Sort by portfolio percentage (active holdings first, then sold)
    all_holdings.sort_by! { |h| [-h[:percent_of_portfolio], h[:issuer_name]] }

    render json: {
      manager: manager,
      holdings: all_holdings,
      summary: {
        q3_portfolio_value: q3_filing.holdings_value_calculated,
        q3_holdings_count: q3_holdings.count,
        q2_portfolio_value: q2_filing&.holdings_value_calculated,
        q2_holdings_count: q2_filing&.aggregate_holdings&.count,
        new_positions: all_holdings.count { |h| h[:activity] == 'new' },
        increased_positions: all_holdings.count { |h| h[:activity] == 'increased' },
        decreased_positions: all_holdings.count { |h| h[:activity] == 'decreased' },
        sold_positions: all_holdings.count { |h| h[:activity] == 'sold' },
        unchanged_positions: all_holdings.count { |h| h[:activity] == 'unchanged' }
      }
    }
  end

  private

  def set_public_cache_header
    expires_in 1.hour, public: true
  end
end
