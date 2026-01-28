"""
Four Types of Sampling Bias in Data Collection
Visual explanation of common bias types for AP Statistics students

Run with: manim -qm --format=mp4 sampling_bias_types.py SamplingBiasTypes
"""
from manim import *


class SamplingBiasTypes(Scene):
    def construct(self):
        # Title
        title = Text("Four Types of Sampling Bias", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Subtitle
        subtitle = Text(
            "Why samples may not represent the population",
            font_size=24,
            color=GRAY
        )
        subtitle.next_to(title, DOWN, buff=0.2)
        self.play(Write(subtitle))
        self.wait(1)

        self.play(FadeOut(subtitle))

        # Show each bias type
        self.show_voluntary_response_bias(title)
        self.show_undercoverage_bias(title)
        self.show_nonresponse_bias(title)
        self.show_response_bias(title)

        # Summary
        self.show_summary(title)

    def create_person(self, color=BLUE, scale=0.3):
        """Create a simple person icon using circles and lines"""
        head = Circle(radius=0.15 * scale, color=color, fill_opacity=1)
        body = Line(
            start=head.get_bottom(),
            end=head.get_bottom() + DOWN * 0.4 * scale,
            color=color,
            stroke_width=3
        )
        left_arm = Line(
            start=body.get_center(),
            end=body.get_center() + LEFT * 0.2 * scale + DOWN * 0.1 * scale,
            color=color,
            stroke_width=3
        )
        right_arm = Line(
            start=body.get_center(),
            end=body.get_center() + RIGHT * 0.2 * scale + DOWN * 0.1 * scale,
            color=color,
            stroke_width=3
        )
        left_leg = Line(
            start=body.get_end(),
            end=body.get_end() + LEFT * 0.15 * scale + DOWN * 0.25 * scale,
            color=color,
            stroke_width=3
        )
        right_leg = Line(
            start=body.get_end(),
            end=body.get_end() + RIGHT * 0.15 * scale + DOWN * 0.25 * scale,
            color=color,
            stroke_width=3
        )
        person = VGroup(head, body, left_arm, right_arm, left_leg, right_leg)
        return person

    def create_people_group(self, n, colors, spacing=0.5):
        """Create a group of people with specified colors"""
        people = VGroup()
        for i in range(n):
            person = self.create_person(color=colors[i] if i < len(colors) else GRAY)
            person.shift(RIGHT * i * spacing)
            people.add(person)
        return people

    def show_voluntary_response_bias(self, title):
        # Clear area below title
        bias_name = Text("1. Voluntary Response Bias", font_size=32, color=YELLOW)
        bias_name.next_to(title, DOWN, buff=0.5)
        self.play(Write(bias_name))

        # Example context
        example = Text("Example: Online poll about a controversial topic", font_size=20)
        example.next_to(bias_name, DOWN, buff=0.3)
        self.play(Write(example))

        # Visual: Computer/poll on left, people choosing to respond on right
        computer = Rectangle(width=1.2, height=0.9, color=WHITE)
        screen = Rectangle(width=1.0, height=0.6, color=BLUE_E, fill_opacity=0.3)
        screen.move_to(computer.get_center() + UP * 0.1)
        poll_text = Text("POLL", font_size=14, color=WHITE)
        poll_text.move_to(screen.get_center())
        computer_group = VGroup(computer, screen, poll_text)
        computer_group.shift(LEFT * 4 + DOWN * 1)

        self.play(Create(computer_group))

        # Create population - mix of motivated (red) and neutral (gray) people
        population_label = Text("Population", font_size=18)
        population_label.shift(RIGHT * 2 + UP * 0.3)

        # Create 10 people - 3 angry (motivated), 7 neutral
        people = VGroup()
        positions = [
            RIGHT * 0.5, RIGHT * 1.0, RIGHT * 1.5, RIGHT * 2.0, RIGHT * 2.5,
            RIGHT * 0.5 + DOWN * 0.8, RIGHT * 1.0 + DOWN * 0.8, RIGHT * 1.5 + DOWN * 0.8,
            RIGHT * 2.0 + DOWN * 0.8, RIGHT * 2.5 + DOWN * 0.8
        ]
        # Motivated people at indices 0, 3, 6 (spread out)
        motivated_indices = [0, 3, 6]

        for i, pos in enumerate(positions):
            if i in motivated_indices:
                color = RED
            else:
                color = GRAY
            person = self.create_person(color=color, scale=0.4)
            person.move_to(pos + DOWN * 1)
            people.add(person)

        self.play(Write(population_label))
        self.play(LaggedStart(*[FadeIn(p) for p in people], lag_ratio=0.1))
        self.wait(0.5)

        # Show only motivated people responding
        arrows = VGroup()
        for i in motivated_indices:
            arrow = Arrow(
                start=people[i].get_left(),
                end=computer_group.get_right() + UP * 0.2 * (i - 3),
                color=RED,
                buff=0.1,
                stroke_width=2
            )
            arrows.add(arrow)

        response_label = Text("Only strongly opinionated respond!", font_size=16, color=RED)
        response_label.shift(DOWN * 2.5)

        self.play(
            LaggedStart(*[GrowArrow(a) for a in arrows], lag_ratio=0.2),
            Write(response_label)
        )
        self.wait(0.5)

        # What goes wrong
        wrong_box = Rectangle(width=5, height=0.6, color=RED, fill_opacity=0.2)
        wrong_box.shift(DOWN * 3.2)
        wrong_text = Text(
            "WRONG: Sample over-represents extreme views",
            font_size=18,
            color=RED
        )
        wrong_text.move_to(wrong_box.get_center())

        self.play(Create(wrong_box), Write(wrong_text))
        self.wait(1.5)

        # Clear for next bias
        self.play(
            FadeOut(bias_name), FadeOut(example), FadeOut(computer_group),
            FadeOut(population_label), FadeOut(people), FadeOut(arrows),
            FadeOut(response_label), FadeOut(wrong_box), FadeOut(wrong_text)
        )

    def show_undercoverage_bias(self, title):
        bias_name = Text("2. Undercoverage Bias", font_size=32, color=YELLOW)
        bias_name.next_to(title, DOWN, buff=0.5)
        self.play(Write(bias_name))

        example = Text("Example: Phone survey using landlines only", font_size=20)
        example.next_to(bias_name, DOWN, buff=0.3)
        self.play(Write(example))

        # Sampling frame (landline list) vs actual population
        frame_label = Text("Sampling Frame", font_size=18)
        frame_label.shift(LEFT * 3 + UP * 0.2)

        pop_label = Text("Actual Population", font_size=18)
        pop_label.shift(RIGHT * 2.5 + UP * 0.2)

        self.play(Write(frame_label), Write(pop_label))

        # Sampling frame - only older people with landlines
        frame_box = Rectangle(width=2.5, height=2, color=BLUE)
        frame_box.shift(LEFT * 3 + DOWN * 1.2)

        frame_people = VGroup()
        for i in range(4):
            person = self.create_person(color=BLUE, scale=0.35)
            person.move_to(frame_box.get_center() +
                          LEFT * 0.4 * (i % 2 - 0.5) +
                          DOWN * 0.5 * (i // 2 - 0.5))
            frame_people.add(person)

        # Phone icons next to frame people
        phone_icon = Text("Landline", font_size=12, color=BLUE)
        phone_icon.next_to(frame_box, DOWN, buff=0.1)

        self.play(Create(frame_box), LaggedStart(*[FadeIn(p) for p in frame_people], lag_ratio=0.1))
        self.play(Write(phone_icon))

        # Actual population - includes cell-only users (missing from frame)
        pop_box = Rectangle(width=3.5, height=2.5, color=WHITE, stroke_opacity=0.5)
        pop_box.shift(RIGHT * 2.5 + DOWN * 1.2)

        pop_people = VGroup()
        # 4 with landlines (blue), 5 cell-only (gray - missing!)
        pop_positions = [
            LEFT * 0.8 + UP * 0.5, LEFT * 0.2 + UP * 0.5, RIGHT * 0.4 + UP * 0.5,
            LEFT * 0.8, LEFT * 0.2, RIGHT * 0.4, RIGHT * 1.0,
            LEFT * 0.5 + DOWN * 0.6, RIGHT * 0.2 + DOWN * 0.6
        ]
        for i, pos in enumerate(pop_positions):
            if i < 4:
                color = BLUE  # Has landline
            else:
                color = GRAY  # Cell-only - MISSING
            person = self.create_person(color=color, scale=0.35)
            person.move_to(pop_box.get_center() + pos * 0.7)
            pop_people.add(person)

        self.play(Create(pop_box), LaggedStart(*[FadeIn(p) for p in pop_people], lag_ratio=0.1))

        # Label the missing group
        missing_label = Text("Cell-only users", font_size=14, color=GRAY)
        missing_label.next_to(pop_box, DOWN, buff=0.1)
        missing_note = Text("(MISSING from frame!)", font_size=12, color=RED)
        missing_note.next_to(missing_label, DOWN, buff=0.05)

        self.play(Write(missing_label), Write(missing_note))
        self.wait(0.5)

        # Cross out missing people
        crosses = VGroup()
        for i in range(4, 9):
            cross = Cross(pop_people[i], color=RED, stroke_width=2)
            crosses.add(cross)

        self.play(LaggedStart(*[Create(c) for c in crosses], lag_ratio=0.1))
        self.wait(0.5)

        # What goes wrong
        wrong_box = Rectangle(width=5.5, height=0.6, color=RED, fill_opacity=0.2)
        wrong_box.shift(DOWN * 3.2)
        wrong_text = Text(
            "WRONG: Entire groups excluded from sample",
            font_size=18,
            color=RED
        )
        wrong_text.move_to(wrong_box.get_center())

        self.play(Create(wrong_box), Write(wrong_text))
        self.wait(1.5)

        # Clear
        self.play(
            FadeOut(bias_name), FadeOut(example), FadeOut(frame_label),
            FadeOut(pop_label), FadeOut(frame_box), FadeOut(frame_people),
            FadeOut(phone_icon), FadeOut(pop_box), FadeOut(pop_people),
            FadeOut(missing_label), FadeOut(missing_note), FadeOut(crosses),
            FadeOut(wrong_box), FadeOut(wrong_text)
        )

    def show_nonresponse_bias(self, title):
        bias_name = Text("3. Nonresponse Bias", font_size=32, color=YELLOW)
        bias_name.next_to(title, DOWN, buff=0.5)
        self.play(Write(bias_name))

        example = Text("Example: Mailed surveys with low return rate", font_size=20)
        example.next_to(bias_name, DOWN, buff=0.3)
        self.play(Write(example))

        # Show selected sample
        selected_label = Text("Selected Sample (n=10)", font_size=18)
        selected_label.shift(LEFT * 3 + UP * 0.2)
        self.play(Write(selected_label))

        # Create 10 selected people
        selected_people = VGroup()
        for i in range(10):
            person = self.create_person(color=BLUE, scale=0.35)
            person.move_to(
                LEFT * 3 + DOWN * 0.5 +
                RIGHT * 0.5 * (i % 5) +
                DOWN * 0.7 * (i // 5)
            )
            selected_people.add(person)

        self.play(LaggedStart(*[FadeIn(p) for p in selected_people], lag_ratio=0.05))

        # Send surveys
        surveys = VGroup()
        for i, person in enumerate(selected_people):
            survey = Rectangle(width=0.2, height=0.15, color=WHITE, fill_opacity=0.8)
            survey.next_to(person, RIGHT, buff=0.05)
            surveys.add(survey)

        self.play(LaggedStart(*[FadeIn(s) for s in surveys], lag_ratio=0.05))
        self.wait(0.3)

        # Arrow to responses
        arrow = Arrow(LEFT * 0.5, RIGHT * 0.5, color=WHITE)
        arrow.shift(DOWN * 1)
        self.play(GrowArrow(arrow))

        # Only some respond - those who responded might be systematically different
        response_label = Text("Responses Received", font_size=18)
        response_label.shift(RIGHT * 2.5 + UP * 0.2)
        self.play(Write(response_label))

        # Only 4 out of 10 respond - and they're different (e.g., more interested)
        responders_indices = [1, 3, 5, 8]  # Only these respond

        responded_people = VGroup()
        for i, idx in enumerate(responders_indices):
            person = self.create_person(color=BLUE, scale=0.35)
            person.move_to(RIGHT * 2 + DOWN * 0.5 + RIGHT * 0.5 * (i % 2) + DOWN * 0.7 * (i // 2))
            responded_people.add(person)

        # Return survey icons
        return_surveys = VGroup()
        for person in responded_people:
            survey = Rectangle(width=0.2, height=0.15, color=GREEN, fill_opacity=0.8)
            survey.next_to(person, RIGHT, buff=0.05)
            return_surveys.add(survey)

        self.play(
            LaggedStart(*[FadeIn(p) for p in responded_people], lag_ratio=0.1),
            LaggedStart(*[FadeIn(s) for s in return_surveys], lag_ratio=0.1)
        )

        # Mark non-responders with X
        non_responders = [0, 2, 4, 6, 7, 9]
        crosses = VGroup()
        for idx in non_responders:
            selected_people[idx].set_color(GRAY)
            cross = Cross(selected_people[idx], color=RED, stroke_width=2)
            crosses.add(cross)

        no_return = Text("Did not return", font_size=12, color=RED)
        no_return.shift(LEFT * 3 + DOWN * 2.5)

        self.play(
            LaggedStart(*[Create(c) for c in crosses], lag_ratio=0.1),
            Write(no_return)
        )
        self.wait(0.5)

        # Rate display
        rate = Text("Response rate: 40%", font_size=16, color=ORANGE)
        rate.shift(DOWN * 1.8)
        self.play(Write(rate))

        # What goes wrong
        wrong_box = Rectangle(width=5.8, height=0.6, color=RED, fill_opacity=0.2)
        wrong_box.shift(DOWN * 3.2)
        wrong_text = Text(
            "WRONG: Responders may differ from non-responders",
            font_size=18,
            color=RED
        )
        wrong_text.move_to(wrong_box.get_center())

        self.play(Create(wrong_box), Write(wrong_text))
        self.wait(1.5)

        # Clear
        self.play(
            FadeOut(bias_name), FadeOut(example), FadeOut(selected_label),
            FadeOut(selected_people), FadeOut(surveys), FadeOut(arrow),
            FadeOut(response_label), FadeOut(responded_people), FadeOut(return_surveys),
            FadeOut(crosses), FadeOut(no_return), FadeOut(rate),
            FadeOut(wrong_box), FadeOut(wrong_text)
        )

    def show_response_bias(self, title):
        bias_name = Text("4. Response Bias", font_size=32, color=YELLOW)
        bias_name.next_to(title, DOWN, buff=0.5)
        self.play(Write(bias_name))

        example = Text("Example: Leading question affects answers", font_size=20)
        example.next_to(bias_name, DOWN, buff=0.3)
        self.play(Write(example))

        # Show two versions of same question
        neutral_box = Rectangle(width=5.5, height=1.2, color=BLUE, fill_opacity=0.1)
        neutral_box.shift(LEFT * 0 + DOWN * 0.3)

        neutral_label = Text("Neutral Question:", font_size=16, color=BLUE)
        neutral_label.next_to(neutral_box, UP, buff=0.1)

        neutral_q = Text(
            '"Do you support the new policy?"',
            font_size=18
        )
        neutral_q.move_to(neutral_box.get_center())

        self.play(Create(neutral_box), Write(neutral_label), Write(neutral_q))
        self.wait(0.5)

        # Show balanced responses
        neutral_results = VGroup()
        yes_bar = Rectangle(width=1.5, height=0.3, color=GREEN, fill_opacity=0.7)
        no_bar = Rectangle(width=1.5, height=0.3, color=RED, fill_opacity=0.7)
        yes_bar.shift(LEFT * 3.5 + DOWN * 1.3)
        no_bar.shift(LEFT * 3.5 + DOWN * 1.7)
        yes_label = Text("Yes: 50%", font_size=14, color=GREEN)
        no_label = Text("No: 50%", font_size=14, color=RED)
        yes_label.next_to(yes_bar, RIGHT, buff=0.1)
        no_label.next_to(no_bar, RIGHT, buff=0.1)
        neutral_results.add(yes_bar, no_bar, yes_label, no_label)

        self.play(
            Create(yes_bar), Create(no_bar),
            Write(yes_label), Write(no_label)
        )

        # VS
        vs_text = Text("VS", font_size=24, color=WHITE)
        vs_text.shift(DOWN * 1.5)
        self.play(Write(vs_text))

        # Leading question
        leading_box = Rectangle(width=5.5, height=1.2, color=RED, fill_opacity=0.1)
        leading_box.shift(LEFT * 0 + DOWN * 2.5)

        leading_label = Text("Leading Question:", font_size=16, color=RED)
        leading_label.next_to(leading_box, UP, buff=0.1)

        leading_q = Text(
            '"Do you support the wasteful new policy?"',
            font_size=18
        )
        leading_q.move_to(leading_box.get_center())

        # Highlight the bias word
        bias_word = Text("wasteful", font_size=18, color=RED)
        # Position over the word in the question
        bias_word.move_to(leading_q.get_center() + LEFT * 0.3)

        self.play(Create(leading_box), Write(leading_label), Write(leading_q))
        self.wait(0.3)

        # Circle the biased word
        circle = Ellipse(width=1.2, height=0.5, color=RED)
        circle.move_to(leading_box.get_center() + LEFT * 0.9)
        self.play(Create(circle))

        # Show skewed responses
        biased_results = VGroup()
        yes_bar2 = Rectangle(width=0.6, height=0.3, color=GREEN, fill_opacity=0.7)
        no_bar2 = Rectangle(width=2.4, height=0.3, color=RED, fill_opacity=0.7)
        yes_bar2.shift(RIGHT * 2.5 + DOWN * 1.3)
        no_bar2.shift(RIGHT * 2.5 + DOWN * 1.7)
        yes_label2 = Text("Yes: 20%", font_size=14, color=GREEN)
        no_label2 = Text("No: 80%", font_size=14, color=RED)
        yes_label2.next_to(yes_bar2, RIGHT, buff=0.1)
        no_label2.next_to(no_bar2, RIGHT, buff=0.1)
        biased_results.add(yes_bar2, no_bar2, yes_label2, no_label2)

        self.play(
            Create(yes_bar2), Create(no_bar2),
            Write(yes_label2), Write(no_label2)
        )
        self.wait(0.5)

        # What goes wrong
        wrong_box = Rectangle(width=5.8, height=0.6, color=RED, fill_opacity=0.2)
        wrong_box.shift(DOWN * 3.5)
        wrong_text = Text(
            "WRONG: Question wording distorts true opinions",
            font_size=18,
            color=RED
        )
        wrong_text.move_to(wrong_box.get_center())

        self.play(Create(wrong_box), Write(wrong_text))
        self.wait(1.5)

        # Clear
        self.play(
            FadeOut(bias_name), FadeOut(example),
            FadeOut(neutral_box), FadeOut(neutral_label), FadeOut(neutral_q),
            FadeOut(neutral_results), FadeOut(vs_text),
            FadeOut(leading_box), FadeOut(leading_label), FadeOut(leading_q),
            FadeOut(circle), FadeOut(biased_results),
            FadeOut(wrong_box), FadeOut(wrong_text)
        )

    def show_summary(self, title):
        summary_title = Text("Summary: Four Types of Sampling Bias", font_size=32, color=GREEN)
        summary_title.next_to(title, DOWN, buff=0.5)
        self.play(Write(summary_title))

        # Create summary table
        bias_types = [
            ("1. Voluntary Response", "Only motivated respond", RED),
            ("2. Undercoverage", "Groups missing from frame", RED),
            ("3. Nonresponse", "Selected don't respond", RED),
            ("4. Response", "Question affects answer", RED),
        ]

        summary_group = VGroup()
        for i, (bias_type, problem, color) in enumerate(bias_types):
            name = Text(bias_type, font_size=22, color=YELLOW)
            arrow = Text(" -> ", font_size=22)
            issue = Text(problem, font_size=22, color=color)

            row = VGroup(name, arrow, issue).arrange(RIGHT, buff=0.2)
            summary_group.add(row)

        summary_group.arrange(DOWN, buff=0.4, aligned_edge=LEFT)
        summary_group.shift(DOWN * 0.8)

        for row in summary_group:
            self.play(Write(row), run_time=0.6)

        self.wait(1)

        # Key takeaway
        takeaway_box = Rectangle(width=6, height=0.8, color=BLUE, fill_opacity=0.2)
        takeaway_box.shift(DOWN * 3)
        takeaway = Text(
            "All biases make samples unrepresentative!",
            font_size=22,
            color=BLUE
        )
        takeaway.move_to(takeaway_box.get_center())

        self.play(Create(takeaway_box), Write(takeaway))
        self.wait(2)


class VoluntaryResponseDetail(Scene):
    """Extended explanation of voluntary response bias"""
    def construct(self):
        title = Text("Voluntary Response Bias", font_size=40, color=YELLOW)
        title.to_edge(UP)
        self.play(Write(title))

        definition = Text(
            "Occurs when participants self-select into a sample",
            font_size=24
        )
        definition.next_to(title, DOWN, buff=0.5)
        self.play(Write(definition))

        examples = VGroup(
            Text("Examples:", font_size=22, color=GREEN),
            Text("- Call-in radio polls", font_size=20),
            Text("- Online product reviews", font_size=20),
            Text("- Website feedback forms", font_size=20),
            Text("- Social media polls", font_size=20),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        examples.shift(LEFT * 2 + DOWN * 0.5)

        self.play(Write(examples), run_time=2)
        self.wait(1)

        problem = VGroup(
            Text("Problem:", font_size=22, color=RED),
            Text("People with strong opinions are", font_size=20),
            Text("more likely to take the effort", font_size=20),
            Text("to respond", font_size=20),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        problem.shift(RIGHT * 2 + DOWN * 0.5)

        self.play(Write(problem), run_time=2)
        self.wait(2)
