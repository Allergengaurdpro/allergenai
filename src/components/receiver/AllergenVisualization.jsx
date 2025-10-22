import React from 'react';
import { getAllergenIcon, getAllergenInfo } from '../../utils/allergenDetection';

const AllergenVisualization = ({ allergens, showDetails = false, showEducation = false }) => {
  if (!allergens || allergens.length === 0) {
    return (
      <div className="allergen-visualization no-allergens">
        <div className="no-allergen-badge">
          <span className="badge-icon">✓</span>
          <span className="badge-text">No Priority Allergens Detected</span>
        </div>
        <p className="allergen-safe-note">
          This product appears to be free of the 11 Canadian priority allergens.
        </p>
      </div>
    );
  }

  // Group by priority
  const highPriority = allergens.filter(a => a.priority === 'high');
  const mediumPriority = allergens.filter(a => a.priority === 'medium');

  return (
    <div className="allergen-visualization">
      {highPriority.length > 0 && (
        <div className="allergen-group">
          <div className="allergen-group-header priority-high">
            <span className="priority-label">⚠️ High Priority Allergens</span>
            <span className="allergen-count">{highPriority.length}</span>
          </div>
          <div className="allergen-list">
            {highPriority.map((allergen, index) => (
              <div key={index} className="allergen-item priority-high">
                <span className="allergen-icon">{getAllergenIcon(allergen.name)}</span>
                <span className="allergen-name">{allergen.name}</span>
                {showDetails && allergen.foundInContains && (
                  <span className="allergen-source" title="Found in Contains statement">
                    📋
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mediumPriority.length > 0 && (
        <div className="allergen-group">
          <div className="allergen-group-header priority-medium">
            <span className="priority-label">⚠️ Medium Priority Allergens</span>
            <span className="allergen-count">{mediumPriority.length}</span>
          </div>
          <div className="allergen-list">
            {mediumPriority.map((allergen, index) => (
              <div key={index} className="allergen-item priority-medium">
                <span className="allergen-icon">{getAllergenIcon(allergen.name)}</span>
                <span className="allergen-name">{allergen.name}</span>
                {showDetails && allergen.foundInContains && (
                  <span className="allergen-source" title="Found in Contains statement">
                    📋
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="allergen-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-value">{allergens.length}</span>
            <span className="stat-label">
              Priority Allergen{allergens.length !== 1 ? 's' : ''} Detected
            </span>
          </div>
          {highPriority.length > 0 && (
            <div className="stat-item high">
              <span className="stat-value">{highPriority.length}</span>
              <span className="stat-label">High Priority</span>
            </div>
          )}
          {mediumPriority.length > 0 && (
            <div className="stat-item medium">
              <span className="stat-value">{mediumPriority.length}</span>
              <span className="stat-label">Medium Priority</span>
            </div>
          )}
        </div>

        {allergens.some(a => a.foundInContains) && (
          <div className="allergen-legend">
            <span className="legend-icon">📋</span>
            <span className="legend-text">
              Found in "Contains" statement (Health Canada requirement)
            </span>
          </div>
        )}

        {showEducation && (
          <div className="allergen-education-link">
            <p>
              <strong>ℹ️ About Canadian Priority Allergens:</strong>
            </p>
            <p className="education-text">
              These allergens account for 90% of allergic reactions in Canada and must be
              declared on food labels under federal regulations (Health Canada, 2012).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllergenVisualization;
