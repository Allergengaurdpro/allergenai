import React from 'react';

const AllergenEducation = () => {
  return (
    <div className="allergen-education">
      <div className="education-header">
        <h3>🇨🇦 Canadian Priority Food Allergens</h3>
        <p className="education-subtitle">
          Regulated by Health Canada & Canadian Food Inspection Agency (CFIA)
        </p>
      </div>

      <div className="education-content">
        <div className="education-section">
          <h4>What are Priority Allergens?</h4>
          <p>
            Priority allergens are the foods most frequently associated with severe allergic
            reactions in Canada. These 11 allergens account for approximately <strong>90% of
            food allergic reactions</strong> in the country.
          </p>
        </div>

        <div className="education-section">
          <h4>Labelling Requirements</h4>
          <p>
            Since August 2012, federal regulations require that priority allergens be clearly
            declared on food labels in Canada. They must appear:
          </p>
          <ul>
            <li>✓ In the <strong>ingredients list</strong> in plain language</li>
            <li>✓ In a separate <strong>"Contains" statement</strong> immediately after the ingredients</li>
            <li>✓ Using consistent and easy-to-understand terminology</li>
          </ul>
        </div>

        <div className="allergen-grid">
          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🥜</span>
            <h5>Peanuts</h5>
            <p className="allergen-description">
              One of the most common and severe allergens. Can cause life-threatening reactions.
            </p>
          </div>

          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🌰</span>
            <h5>Tree Nuts</h5>
            <p className="allergen-description">
              Includes almonds, cashews, walnuts, hazelnuts, pecans, pistachios, Brazil nuts,
              macadamia nuts, and pine nuts.
            </p>
          </div>

          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🥛</span>
            <h5>Milk</h5>
            <p className="allergen-description">
              Includes all dairy products: butter, cheese, cream, yogurt, whey, casein, and lactose.
            </p>
          </div>

          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🥚</span>
            <h5>Eggs</h5>
            <p className="allergen-description">
              Includes egg whites, yolks, and derivatives like albumin and ovalbumin.
            </p>
          </div>

          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🐟</span>
            <h5>Fish</h5>
            <p className="allergen-description">
              All types of fish including salmon, tuna, cod, and anchovies. Must declare specific type.
            </p>
          </div>

          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🦐</span>
            <h5>Crustaceans & Molluscs</h5>
            <p className="allergen-description">
              Shellfish including shrimp, crab, lobster, clams, oysters, mussels, and scallops.
            </p>
          </div>

          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🫘</span>
            <h5>Soy</h5>
            <p className="allergen-description">
              Includes soybeans, soy protein, soy lecithin, tofu, tempeh, and miso.
            </p>
          </div>

          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🌾</span>
            <h5>Wheat & Triticale</h5>
            <p className="allergen-description">
              All wheat products including flour, semolina, spelt, kamut, and wheat-rye hybrid (triticale).
            </p>
          </div>

          <div className="allergen-card high-priority">
            <span className="allergen-emoji">🫘</span>
            <h5>Sesame Seeds</h5>
            <p className="allergen-description">
              Includes sesame oil, tahini, and sesame paste. Growing concern in recent years.
            </p>
          </div>

          <div className="allergen-card medium-priority">
            <span className="allergen-emoji">🌭</span>
            <h5>Mustard</h5>
            <p className="allergen-description">
              Includes mustard seeds, mustard powder, and mustard-based condiments.
            </p>
          </div>

          <div className="allergen-card medium-priority">
            <span className="allergen-emoji">⚗️</span>
            <h5>Sulphites</h5>
            <p className="allergen-description">
              Food additives and preservatives. Must be declared when ≥10 mg/kg (10 ppm).
            </p>
          </div>
        </div>

        <div className="education-section">
          <h4>Legal Requirements</h4>
          <div className="legal-notice">
            <p>
              <strong>⚖️ Federal Regulations:</strong> Under the <em>Food and Drugs Act</em> and
              <em> Safe Food for Canadians Act</em>, food manufacturers must declare all priority
              allergens on product labels. Failure to do so may result in enforcement measures
              including product recalls.
            </p>
          </div>
        </div>

        <div className="education-section">
          <h4>For Food Service Operations</h4>
          <p>
            Food chains and restaurants in Canada are strongly encouraged to:
          </p>
          <ul>
            <li>✓ Maintain accurate allergen information for all menu items</li>
            <li>✓ Train staff on allergen awareness and cross-contamination prevention</li>
            <li>✓ Clearly label foods containing priority allergens</li>
            <li>✓ Have procedures in place to respond to customer allergen inquiries</li>
            <li>✓ Keep detailed records of ingredients and suppliers</li>
          </ul>
        </div>

        <div className="education-footer">
          <p>
            <strong>Sources:</strong>
          </p>
          <ul className="sources-list">
            <li>• Food Allergy Canada (foodallergycanada.ca)</li>
            <li>• Health Canada - Food Allergen Labelling</li>
            <li>• Canadian Food Inspection Agency (CFIA)</li>
            <li>• Enhanced Labelling Regulations (2012)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AllergenEducation;
