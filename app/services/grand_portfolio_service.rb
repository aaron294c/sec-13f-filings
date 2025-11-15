class GrandPortfolioService
  def initialize(year:, quarter:, superinvestor_ciks:)
    @year = year
    @quarter = quarter
    @superinvestor_ciks = superinvestor_ciks
  end

  # Get consensus holdings - stocks owned by multiple superinvestors
  def consensus_holdings
    @consensus_holdings ||= compute_consensus_holdings
  end

  # Get highest aggregate value holdings across all superinvestors
  def top_holdings_by_value
    @top_holdings_by_value ||= compute_top_holdings_by_value
  end

  # Get stocks with highest average position size among owners
  def top_conviction_holdings
    @top_conviction_holdings ||= compute_top_conviction_holdings
  end

  # Get sector concentration analysis
  def sector_breakdown
    @sector_breakdown ||= compute_sector_breakdown
  end

  # Get emerging consensus - stocks gaining popularity
  def emerging_consensus(prev_year:, prev_quarter:)
    @emerging_consensus ||= compute_emerging_consensus(prev_year, prev_quarter)
  end

  # Get fading consensus - stocks losing popularity
  def fading_consensus(prev_year:, prev_quarter:)
    @fading_consensus ||= compute_fading_consensus(prev_year, prev_quarter)
  end

  # Get grand portfolio stats summary
  def portfolio_stats
    {
      total_managers: @superinvestor_ciks.count,
      total_unique_stocks: consensus_holdings.count,
      total_value: consensus_holdings.sum { |h| h[:total_value] },
      avg_stocks_per_manager: avg_stocks_per_manager,
      most_popular_stock: consensus_holdings.first
    }
  end

  private

  def compute_consensus_holdings
    sql = <<~SQL
      SELECT
        COALESCE(csm.symbol, ah.cusip) as ticker,
        ah.issuer_name,
        COUNT(DISTINCT tf.cik) as owner_count,
        SUM(ah.value) as total_value,
        SUM(ah.shares_or_principal_amount) as total_shares,
        AVG(ah.value * 100.0 / tf.holdings_value_calculated) as avg_position_pct,
        MAX(ah.value * 100.0 / tf.holdings_value_calculated) as max_position_pct,
        MIN(ah.value * 100.0 / tf.holdings_value_calculated) as min_position_pct,
        STRING_AGG(DISTINCT tf.name, '|||' ORDER BY tf.name) as owner_names
      FROM aggregate_holdings ah
      INNER JOIN thirteen_fs tf ON tf.id = ah.thirteen_f_id
      LEFT JOIN cusip_symbol_mappings csm ON csm.cusip = ah.cusip
      WHERE tf.cik IN (?)
        AND tf.report_year = ?
        AND tf.report_quarter = ?
        AND tf.restated_by_id IS NULL
      GROUP BY COALESCE(csm.symbol, ah.cusip), ah.issuer_name
      HAVING COUNT(DISTINCT tf.cik) >= 1
      ORDER BY COUNT(DISTINCT tf.cik) DESC, SUM(ah.value) DESC
      LIMIT 100
    SQL

    results = ActiveRecord::Base.connection.exec_query(
      ActiveRecord::Base.send(:sanitize_sql_array, [sql, @superinvestor_ciks, @year, @quarter])
    )

    results.map do |row|
      {
        ticker: row['ticker'],
        issuer_name: row['issuer_name'],
        owner_count: row['owner_count'].to_i,
        total_value: row['total_value'].to_f,
        total_shares: row['total_shares']&.to_i,
        avg_position_pct: row['avg_position_pct']&.to_f,
        max_position_pct: row['max_position_pct']&.to_f,
        min_position_pct: row['min_position_pct']&.to_f,
        owner_names: row['owner_names']&.split('|||') || []
      }
    end
  end

  def compute_top_holdings_by_value
    consensus_holdings.sort_by { |h| -h[:total_value] }.first(50)
  end

  def compute_top_conviction_holdings
    # Filter to stocks owned by at least 2 managers and sort by max position %
    consensus_holdings
      .select { |h| h[:owner_count] >= 2 }
      .sort_by { |h| -h[:max_position_pct] }
      .first(50)
  end

  def compute_sector_breakdown
    # This is simplified - in production you'd join with a sector mapping table
    # For now, we'll just return placeholder
    []
  end

  def compute_emerging_consensus(prev_year, prev_quarter)
    current_ownership = get_ownership_counts(@year, @quarter)
    prev_ownership = get_ownership_counts(prev_year, prev_quarter)

    changes = []
    current_ownership.each do |ticker, curr_data|
      prev_count = prev_ownership.dig(ticker, :owner_count) || 0
      change = curr_data[:owner_count] - prev_count

      if change > 0
        changes << {
          ticker: ticker,
          issuer_name: curr_data[:issuer_name],
          current_owners: curr_data[:owner_count],
          previous_owners: prev_count,
          owner_change: change,
          total_value: curr_data[:total_value]
        }
      end
    end

    changes.sort_by { |c| -c[:owner_change] }.first(20)
  end

  def compute_fading_consensus(prev_year, prev_quarter)
    current_ownership = get_ownership_counts(@year, @quarter)
    prev_ownership = get_ownership_counts(prev_year, prev_quarter)

    changes = []
    prev_ownership.each do |ticker, prev_data|
      curr_count = current_ownership.dig(ticker, :owner_count) || 0
      change = prev_data[:owner_count] - curr_count

      if change > 0
        changes << {
          ticker: ticker,
          issuer_name: prev_data[:issuer_name],
          current_owners: curr_count,
          previous_owners: prev_data[:owner_count],
          owner_change: change,
          total_value: prev_data[:total_value]
        }
      end
    end

    changes.sort_by { |c| -c[:owner_change] }.first(20)
  end

  def get_ownership_counts(year, quarter)
    sql = <<~SQL
      SELECT
        COALESCE(csm.symbol, ah.cusip) as ticker,
        ah.issuer_name,
        COUNT(DISTINCT tf.cik) as owner_count,
        SUM(ah.value) as total_value
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
        issuer_name: row['issuer_name'],
        owner_count: row['owner_count'].to_i,
        total_value: row['total_value'].to_f
      }
    end
  end

  def avg_stocks_per_manager
    total_holdings = ThirteenF.
      where(cik: @superinvestor_ciks, report_year: @year, report_quarter: @quarter).
      processed.
      sum(:holdings_count_calculated)

    return 0 if @superinvestor_ciks.empty?
    (total_holdings.to_f / @superinvestor_ciks.count).round(1)
  end
end
