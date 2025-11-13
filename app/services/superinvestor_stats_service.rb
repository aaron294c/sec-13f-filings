# Service to compute aggregated statistics across superinvestor portfolios
class SuperinvestorStatsService
  def initialize(year: nil, quarter: nil, compare_to: nil, superinvestor_ciks: nil)
    @year = year || most_recent_period[:year]
    @quarter = quarter || most_recent_period[:quarter]
    @prev_year, @prev_quarter = previous_quarter(@year, @quarter)
    @two_q_ago_year, @two_q_ago_quarter = previous_quarter(@prev_year, @prev_quarter)
    @superinvestor_ciks = superinvestor_ciks || SUPERINVESTORS.map { |s| s[:cik] }

    # Support comparison between two specific quarters
    if compare_to
      @compare_year = compare_to[:year]
      @compare_quarter = compare_to[:quarter]
    end
  end

  # Get the most recent report period across all superinvestors
  def most_recent_period
    @most_recent_period ||= begin
      # Use Q2 2025 as the most recent (14 managers available)
      { year: 2025, quarter: 2 }
    end
  end

  # Get comparison period (Q1 2025 with 84 managers)
  def comparison_period
    { year: 2025, quarter: 1 }
  end

  # Top 10 stocks by number of managers holding them
  def top_stocks_by_ownership_count
    @top_stocks_by_ownership_count ||= compute_top_stocks_by_count
  end

  # Top 10 stocks by aggregate percentage across all portfolios
  def top_stocks_by_aggregate_percentage
    @top_stocks_by_aggregate_percentage ||= compute_top_stocks_by_percentage
  end

  # Top "big bets" - stocks with highest individual portfolio allocations
  def top_big_bets
    @top_big_bets ||= compute_big_bets
  end

  # Top 10 buys last quarter (by absolute value change)
  def top_buys_last_quarter
    @top_buys_last_quarter ||= compute_top_buys(@year, @quarter, @prev_year, @prev_quarter, by_percentage: false)
  end

  # Top 10 buys last quarter (by percentage change)
  def top_buys_last_quarter_by_pct
    @top_buys_last_quarter_by_pct ||= compute_top_buys(@year, @quarter, @prev_year, @prev_quarter, by_percentage: true)
  end

  # Top 10 buys last 2 quarters (by absolute value change)
  def top_buys_last_two_quarters
    @top_buys_last_two_quarters ||= compute_top_buys(@year, @quarter, @two_q_ago_year, @two_q_ago_quarter, by_percentage: false)
  end

  # Top 10 buys last 2 quarters (by percentage change)
  def top_buys_last_two_quarters_by_pct
    @top_buys_last_two_quarters_by_pct ||= compute_top_buys(@year, @quarter, @two_q_ago_year, @two_q_ago_quarter, by_percentage: true)
  end

  # Get list of superinvestors with their most recent portfolio data
  def superinvestors_list
    @superinvestors_list ||= begin
      filings = ThirteenF.
        where(cik: @superinvestor_ciks, report_year: @year, report_quarter: @quarter).
        processed.
        exclude_restated.
        select(:cik, :name, :holdings_value_calculated, :holdings_count_calculated, :id)

      filings.map do |filing|
        # Generate investor name by cleaning up the official name
        investor_name = filing.name.
          gsub(/\s+(LLC|LP|L\.P\.|INC|CORP|LTD|LIMITED|PARTNERS|CAPITAL|MANAGEMENT|ADVISORS|ADVISOR|FUND|FUNDS|ASSET|INVESTMENTS|GROUP|TRUST|CO)\.?\s*$/i, '').
          strip

        # Get top 10 holdings for this manager
        top_holdings = AggregateHolding.
          where(thirteen_f_id: filing.id).
          order(value: :desc).
          limit(10).
          joins("LEFT JOIN cusip_symbol_mappings ON cusip_symbol_mappings.cusip = aggregate_holdings.cusip").
          pluck(Arel.sql("COALESCE(cusip_symbol_mappings.symbol, aggregate_holdings.cusip)"))

        {
          cik: filing.cik,
          name: filing.name,
          investor: investor_name,
          portfolio_value: filing.holdings_value_calculated&.to_i,
          num_stocks: filing.holdings_count_calculated,
          top_holdings: top_holdings
        }
      end.sort_by { |s| -(s[:portfolio_value] || 0) }
    end
  end

  # Get stats for a specific period with comparison to another period
  def get_period_stats(year, quarter)
    temp_year = @year
    temp_quarter = @quarter
    @year = year
    @quarter = quarter

    stats = {
      top_owned: compute_top_stocks_by_count,
      top_by_pct: compute_top_stocks_by_percentage,
      big_bets: compute_big_bets
    }

    @year = temp_year
    @quarter = temp_quarter
    stats
  end

  # Compare two periods and calculate percentage changes
  def compare_periods(current_year, current_quarter, prev_year, prev_quarter)
    current_stats = get_period_stats(current_year, current_quarter)
    prev_stats = get_period_stats(prev_year, prev_quarter)

    # Add comparison data to current stats
    [:top_owned, :top_by_pct, :big_bets].each do |category|
      current_stats[category].each do |stock|
        prev_stock = prev_stats[category].find { |s| s['ticker'] == stock['ticker'] }

        if prev_stock
          case category
          when :top_owned
            prev_count = prev_stock['ownership_count'].to_i
            curr_count = stock['ownership_count'].to_i
            stock['prev_ownership_count'] = prev_count
            stock['ownership_change'] = curr_count - prev_count
          when :top_by_pct
            prev_pct = prev_stock['weighted_pct'].to_f
            curr_pct = stock['weighted_pct'].to_f
            stock['prev_weighted_pct'] = prev_pct
            stock['pct_change'] = curr_pct - prev_pct
          when :big_bets
            prev_max = prev_stock['max_pct'].to_f
            curr_max = stock['max_pct'].to_f
            stock['prev_max_pct'] = prev_max
            stock['max_pct_change'] = curr_max - prev_max
          end
        else
          stock['is_new'] = true
        end
      end
    end

    current_stats
  end

  private

  def previous_quarter(year, quarter)
    if quarter == 1
      [year - 1, 4]
    else
      [year, quarter - 1]
    end
  end

  def compute_top_stocks_by_count
    # Get all holdings for current period across superinvestors
    sql = <<~SQL
      SELECT
        COALESCE(csm.symbol, ah.cusip) as ticker,
        ah.issuer_name,
        COUNT(DISTINCT tf.cik) as ownership_count,
        SUM(ah.value) as total_value
      FROM aggregate_holdings ah
      INNER JOIN thirteen_fs tf ON tf.id = ah.thirteen_f_id
      LEFT JOIN cusip_symbol_mappings csm ON csm.cusip = ah.cusip
      WHERE tf.cik IN (?)
        AND tf.report_year = ?
        AND tf.report_quarter = ?
        AND tf.restated_by_id IS NULL
      GROUP BY COALESCE(csm.symbol, ah.cusip), ah.issuer_name
      ORDER BY ownership_count DESC, total_value DESC
      LIMIT 10
    SQL

    ActiveRecord::Base.connection.exec_query(
      ActiveRecord::Base.send(:sanitize_sql_array, [sql, @superinvestor_ciks, @year, @quarter])
    ).to_a
  end

  def compute_top_stocks_by_percentage
    # Weight by percentage of each manager's portfolio
    sql = <<~SQL
      SELECT
        COALESCE(csm.symbol, ah.cusip) as ticker,
        ah.issuer_name,
        SUM(ah.value * 100.0 / NULLIF(tf.holdings_value_calculated, 0)) as weighted_pct,
        SUM(ah.value) as total_value,
        COUNT(DISTINCT tf.cik) as ownership_count
      FROM aggregate_holdings ah
      INNER JOIN thirteen_fs tf ON tf.id = ah.thirteen_f_id
      LEFT JOIN cusip_symbol_mappings csm ON csm.cusip = ah.cusip
      WHERE tf.cik IN (?)
        AND tf.report_year = ?
        AND tf.report_quarter = ?
        AND tf.restated_by_id IS NULL
        AND tf.holdings_value_calculated > 0
      GROUP BY COALESCE(csm.symbol, ah.cusip), ah.issuer_name
      ORDER BY weighted_pct DESC
      LIMIT 10
    SQL

    ActiveRecord::Base.connection.exec_query(
      ActiveRecord::Base.send(:sanitize_sql_array, [sql, @superinvestor_ciks, @year, @quarter])
    ).to_a
  end

  def compute_big_bets
    # Find stocks with highest individual portfolio allocations
    sql = <<~SQL
      SELECT
        COALESCE(csm.symbol, ah.cusip) as ticker,
        ah.issuer_name,
        MAX(ah.value * 100.0 / NULLIF(tf.holdings_value_calculated, 0)) as max_pct,
        COUNT(DISTINCT tf.cik) as ownership_count,
        SUM(ah.value) as total_value
      FROM aggregate_holdings ah
      INNER JOIN thirteen_fs tf ON tf.id = ah.thirteen_f_id
      LEFT JOIN cusip_symbol_mappings csm ON csm.cusip = ah.cusip
      WHERE tf.cik IN (?)
        AND tf.report_year = ?
        AND tf.report_quarter = ?
        AND tf.restated_by_id IS NULL
        AND tf.holdings_value_calculated > 0
      GROUP BY COALESCE(csm.symbol, ah.cusip), ah.issuer_name
      ORDER BY max_pct DESC
      LIMIT 10
    SQL

    ActiveRecord::Base.connection.exec_query(
      ActiveRecord::Base.send(:sanitize_sql_array, [sql, @superinvestor_ciks, @year, @quarter])
    ).to_a
  end

  def compute_top_buys(current_year, current_quarter, prev_year, prev_quarter, by_percentage:)
    # Get current period holdings
    current_holdings = get_period_holdings(current_year, current_quarter)
    prev_holdings = get_period_holdings(prev_year, prev_quarter)

    # Calculate changes
    changes = calculate_holding_changes(current_holdings, prev_holdings)

    if by_percentage
      changes.sort_by { |c| -c[:pct_change].to_f }.first(10)
    else
      changes.sort_by { |c| -c[:value_change].to_f }.first(10)
    end
  end

  def get_period_holdings(year, quarter)
    sql = <<~SQL
      SELECT
        COALESCE(csm.symbol, ah.cusip) as ticker,
        ah.issuer_name,
        SUM(ah.value) as total_value,
        COUNT(DISTINCT tf.cik) as holder_count
      FROM aggregate_holdings ah
      INNER JOIN thirteen_fs tf ON tf.id = ah.thirteen_f_id
      LEFT JOIN cusip_symbol_mappings csm ON csm.cusip = ah.cusip
      WHERE tf.cik IN (?)
        AND tf.report_year = ?
        AND tf.report_quarter = ?
        AND tf.restated_by_id IS NULL
      GROUP BY COALESCE(csm.symbol, ah.cusip), ah.issuer_name
    SQL

    results = ActiveRecord::Base.connection.exec_query(
      ActiveRecord::Base.send(:sanitize_sql_array, [sql, @superinvestor_ciks, year, quarter])
    )

    results.each_with_object({}) do |row, hash|
      hash[row['ticker']] = {
        ticker: row['ticker'],
        issuer_name: row['issuer_name'],
        total_value: row['total_value'].to_f,
        holder_count: row['holder_count'].to_i
      }
    end
  end

  def calculate_holding_changes(current, previous)
    changes = []

    current.each do |ticker, curr_data|
      prev_data = previous[ticker]

      if prev_data
        value_change = curr_data[:total_value] - prev_data[:total_value]
        pct_change = if prev_data[:total_value] > 0
          (value_change / prev_data[:total_value]) * 100.0
        else
          0
        end

        # Only include increases (buys)
        if value_change > 0
          changes << {
            ticker: ticker,
            issuer_name: curr_data[:issuer_name],
            value_change: value_change,
            pct_change: pct_change,
            current_value: curr_data[:total_value],
            previous_value: prev_data[:total_value],
            ownership_count: curr_data[:holder_count]
          }
        end
      else
        # New position
        changes << {
          ticker: ticker,
          issuer_name: curr_data[:issuer_name],
          value_change: curr_data[:total_value],
          pct_change: 100.0, # New position = 100% increase
          current_value: curr_data[:total_value],
          previous_value: 0,
          ownership_count: curr_data[:holder_count]
        }
      end
    end

    changes
  end
end
