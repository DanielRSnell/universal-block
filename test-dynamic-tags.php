<?php
/**
 * Test Dynamic Tags Implementation
 *
 * This file tests the dynamic tag parser and Twig processor.
 * Remove this file before production.
 */

// Include WordPress
require_once '../../../wp-config.php';

// Include our classes
require_once 'includes/parser/class-dynamic-tag-parser.php';
require_once 'includes/parser/class-simple-twig-processor.php';

echo "<h2>Testing Dynamic Tags Implementation</h2>\n";

// Test 1: Basic parsing
echo "<h3>Test 1: Basic Tag Parsing</h3>\n";
$test_content = '<set variable="greeting" value="Hello World" /><p>{{ greeting }}</p>';
echo "<strong>Input:</strong> " . esc_html($test_content) . "<br>\n";

$parsed = Universal_Block_Dynamic_Tag_Parser::parse($test_content);
echo "<strong>Parsed:</strong> " . esc_html($parsed) . "<br>\n";

$processed = Universal_Block_Simple_Twig_Processor::process($parsed);
echo "<strong>Output:</strong> " . $processed . "<br><br>\n";

// Test 2: Loop with ACF-like data
echo "<h3>Test 2: Loop Test (Simulated)</h3>\n";
$loop_content = '<loop source="team_members"><div>{{ item.name }} - {{ item.job }}</div></loop>';
echo "<strong>Input:</strong> " . esc_html($loop_content) . "<br>\n";

$parsed = Universal_Block_Dynamic_Tag_Parser::parse($loop_content);
echo "<strong>Parsed:</strong> " . esc_html($parsed) . "<br>\n";

// Simulate some data
$context = array(
    'team_members' => array(
        array('name' => 'John Doe', 'job' => 'Developer'),
        array('name' => 'Jane Smith', 'job' => 'Designer'),
        array('name' => 'Bob Wilson', 'job' => 'Manager')
    )
);

$processed = Universal_Block_Simple_Twig_Processor::process($parsed, $context);
echo "<strong>Output:</strong><br>" . $processed . "<br><br>\n";

// Test 3: Conditional logic
echo "<h3>Test 3: Conditional Logic</h3>\n";
$if_content = '<if source="user.ID > 0"><p>Welcome {{ user.display_name }}!</p></if><if source="user.ID == 0"><p>Please log in</p></if>';
echo "<strong>Input:</strong> " . esc_html($if_content) . "<br>\n";

$parsed = Universal_Block_Dynamic_Tag_Parser::parse($if_content);
echo "<strong>Parsed:</strong> " . esc_html($parsed) . "<br>\n";

$processed = Universal_Block_Simple_Twig_Processor::process($parsed);
echo "<strong>Output:</strong><br>" . $processed . "<br><br>\n";

// Test 4: Complex example
echo "<h3>Test 4: Complex Example</h3>\n";
$complex_content = '
<set variable="post_count" value="5" />
<h2>Latest {{ post_count }} Posts</h2>
<loop source="recent_posts">
    <if source="loop.index == 0">
        <article class="featured">
            <h3>{{ item.title }}</h3>
            <p>{{ item.excerpt }}</p>
        </article>
    </if>
    <if source="loop.index > 0">
        <article class="regular">
            <h4>{{ item.title }}</h4>
        </article>
    </if>
</loop>';

echo "<strong>Input:</strong><pre>" . esc_html($complex_content) . "</pre>\n";

$parsed = Universal_Block_Dynamic_Tag_Parser::parse($complex_content);
echo "<strong>Parsed:</strong><pre>" . esc_html($parsed) . "</pre>\n";

// Simulate post data
$context = array(
    'recent_posts' => array(
        array('title' => 'First Post', 'excerpt' => 'This is the first post excerpt'),
        array('title' => 'Second Post'),
        array('title' => 'Third Post'),
    )
);

$processed = Universal_Block_Simple_Twig_Processor::process($parsed, $context);
echo "<strong>Output:</strong><br>" . $processed . "<br><br>\n";

// Test 5: Validation
echo "<h3>Test 5: Validation Test</h3>\n";
$invalid_content = '<loop source="test"><if source="condition">Content</loop></if>';
echo "<strong>Invalid Input:</strong> " . esc_html($invalid_content) . "<br>\n";

$validation = Universal_Block_Dynamic_Tag_Parser::validate_structure($invalid_content);
echo "<strong>Valid:</strong> " . ($validation['valid'] ? 'Yes' : 'No') . "<br>\n";
if (!empty($validation['errors'])) {
    echo "<strong>Errors:</strong> " . implode(', ', $validation['errors']) . "<br>\n";
}

echo "<p><em>Tests completed!</em></p>";
?>