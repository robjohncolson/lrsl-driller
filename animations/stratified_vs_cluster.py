"""
Stratified vs Cluster Sampling: A visual comparison
Shows the key difference between these two sampling methods for AP Statistics students

Run with: manim -qm --format=mp4 stratified_vs_cluster.py StratifiedVsCluster
"""
from manim import *


class StratifiedVsCluster(Scene):
    def construct(self):
        # Color scheme
        POPULATION_COLOR = BLUE
        SELECTED_COLOR = GREEN
        NOT_SELECTED_COLOR = RED

        # Title
        title = Text("Stratified vs Cluster Sampling", font_size=44)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Create dividing line
        divider = DashedLine(
            start=UP * 2.5,
            end=DOWN * 3.5,
            color=WHITE,
            dash_length=0.1
        )
        self.play(Create(divider))

        # Section labels
        stratified_label = Text("STRATIFIED", font_size=28, color=YELLOW)
        stratified_label.move_to(LEFT * 3.5 + UP * 2)

        cluster_label = Text("CLUSTER", font_size=28, color=YELLOW)
        cluster_label.move_to(RIGHT * 3.5 + UP * 2)

        self.play(Write(stratified_label), Write(cluster_label))
        self.wait(0.5)

        # Create population groups (4 strata/clusters on each side)
        # Left side - Stratified sampling
        strat_groups = VGroup()
        strat_positions = [
            LEFT * 5 + UP * 0.5,
            LEFT * 2.5 + UP * 0.5,
            LEFT * 5 + DOWN * 1.5,
            LEFT * 2.5 + DOWN * 1.5
        ]
        strat_colors = [BLUE_D, BLUE_C, BLUE_B, BLUE_A]

        for i, (pos, color) in enumerate(zip(strat_positions, strat_colors)):
            group = VGroup()
            # Create 6 dots in a 2x3 arrangement
            for row in range(2):
                for col in range(3):
                    dot = Dot(
                        point=pos + RIGHT * col * 0.35 + DOWN * row * 0.35,
                        radius=0.12,
                        color=color
                    )
                    group.add(dot)
            # Add rectangle around the group
            rect = SurroundingRectangle(group, color=color, buff=0.15)
            group.add(rect)
            strat_groups.add(group)

        # Right side - Cluster sampling
        clust_groups = VGroup()
        clust_positions = [
            RIGHT * 2 + UP * 0.5,
            RIGHT * 4.5 + UP * 0.5,
            RIGHT * 2 + DOWN * 1.5,
            RIGHT * 4.5 + DOWN * 1.5
        ]

        for i, (pos, color) in enumerate(zip(clust_positions, strat_colors)):
            group = VGroup()
            # Create 6 dots in a 2x3 arrangement
            for row in range(2):
                for col in range(3):
                    dot = Dot(
                        point=pos + RIGHT * col * 0.35 + DOWN * row * 0.35,
                        radius=0.12,
                        color=color
                    )
                    group.add(dot)
            # Add rectangle around the group
            rect = SurroundingRectangle(group, color=color, buff=0.15)
            group.add(rect)
            clust_groups.add(group)

        # Show all groups
        self.play(
            *[FadeIn(g) for g in strat_groups],
            *[FadeIn(g) for g in clust_groups],
            run_time=1.5
        )
        self.wait(0.5)

        # Labels for groups
        strat_group_labels = VGroup(
            Text("Stratum 1", font_size=16).next_to(strat_groups[0], UP, buff=0.1),
            Text("Stratum 2", font_size=16).next_to(strat_groups[1], UP, buff=0.1),
            Text("Stratum 3", font_size=16).next_to(strat_groups[2], UP, buff=0.1),
            Text("Stratum 4", font_size=16).next_to(strat_groups[3], UP, buff=0.1)
        )

        clust_group_labels = VGroup(
            Text("Cluster 1", font_size=16).next_to(clust_groups[0], UP, buff=0.1),
            Text("Cluster 2", font_size=16).next_to(clust_groups[1], UP, buff=0.1),
            Text("Cluster 3", font_size=16).next_to(clust_groups[2], UP, buff=0.1),
            Text("Cluster 4", font_size=16).next_to(clust_groups[3], UP, buff=0.1)
        )

        self.play(
            *[Write(l) for l in strat_group_labels],
            *[Write(l) for l in clust_group_labels],
            run_time=1
        )
        self.wait(0.5)

        # Step 1: Show the key action description
        strat_action = Text("Sample FROM EACH group", font_size=20, color=GREEN)
        strat_action.move_to(LEFT * 3.75 + DOWN * 2.8)

        clust_action = Text("Select ENTIRE groups", font_size=20, color=GREEN)
        clust_action.move_to(RIGHT * 3.25 + DOWN * 2.8)

        self.play(Write(strat_action), Write(clust_action))
        self.wait(1)

        # Animate stratified sampling - select 2 dots from each group
        strat_selected = VGroup()
        strat_not_selected = VGroup()

        for group in strat_groups:
            dots = [obj for obj in group if isinstance(obj, Dot)]
            # Select first 2 dots from each group
            for j, dot in enumerate(dots):
                if j < 2:
                    strat_selected.add(dot)
                else:
                    strat_not_selected.add(dot)

        # Animate the stratified selection
        self.play(
            *[dot.animate.set_color(SELECTED_COLOR).scale(1.3) for dot in strat_selected],
            run_time=1.5
        )
        self.wait(0.3)
        self.play(
            *[dot.animate.set_color(NOT_SELECTED_COLOR).set_opacity(0.4) for dot in strat_not_selected],
            run_time=1
        )
        self.wait(0.5)

        # Animate cluster sampling - select entire groups 1 and 3
        clust_selected = VGroup()
        clust_not_selected = VGroup()
        selected_clusters = [0, 2]  # Clusters 1 and 3 (0-indexed)

        for i, group in enumerate(clust_groups):
            if i in selected_clusters:
                for obj in group:
                    clust_selected.add(obj)
            else:
                for obj in group:
                    clust_not_selected.add(obj)

        # Animate the cluster selection - highlight entire selected groups
        self.play(
            *[obj.animate.set_color(SELECTED_COLOR) if isinstance(obj, Dot)
              else obj.animate.set_color(SELECTED_COLOR).set_stroke(width=4)
              for obj in clust_selected],
            run_time=1.5
        )
        self.wait(0.3)
        self.play(
            *[obj.animate.set_color(NOT_SELECTED_COLOR).set_opacity(0.4) for obj in clust_not_selected],
            run_time=1
        )
        self.wait(1)

        # Add selection counts
        strat_count = Text("8 selected\n(2 from each)", font_size=16, color=GREEN)
        strat_count.move_to(LEFT * 3.75 + DOWN * 3.4)

        clust_count = Text("12 selected\n(all from 2 clusters)", font_size=16, color=GREEN)
        clust_count.move_to(RIGHT * 3.25 + DOWN * 3.4)

        self.play(Write(strat_count), Write(clust_count))
        self.wait(1)

        # Clear the middle section for summary
        self.play(
            FadeOut(strat_action),
            FadeOut(clust_action),
            FadeOut(strat_count),
            FadeOut(clust_count),
            run_time=0.5
        )

        # Summary comparison box
        summary_title = Text("KEY DIFFERENCE", font_size=28, color=YELLOW)
        summary_title.to_edge(DOWN, buff=1.8)

        summary_box = VGroup()

        strat_summary = VGroup(
            Text("STRATIFIED:", font_size=20, color=BLUE),
            Text("SOME from EVERY group", font_size=18)
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        strat_summary.move_to(LEFT * 3.5 + DOWN * 3.2)

        clust_summary = VGroup(
            Text("CLUSTER:", font_size=20, color=BLUE),
            Text("ALL from SOME groups", font_size=18)
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        clust_summary.move_to(RIGHT * 2.5 + DOWN * 3.2)

        summary_box.add(strat_summary, clust_summary)

        box_rect = SurroundingRectangle(
            VGroup(summary_title, summary_box),
            color=YELLOW,
            buff=0.2
        )

        self.play(Write(summary_title))
        self.play(
            Write(strat_summary),
            Write(clust_summary),
            run_time=1.5
        )
        self.play(Create(box_rect))
        self.wait(2)


class StratifiedVsClusterDetailed(Scene):
    """Extended version with more explanation and real-world examples"""
    def construct(self):
        # Title
        title = Text("Stratified vs Cluster Sampling", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Real-world scenario
        scenario = Text(
            "Scenario: Survey students at a school with 4 grade levels",
            font_size=24
        )
        scenario.next_to(title, DOWN)
        self.play(Write(scenario))
        self.wait(1)

        # Create visual representation of grades
        grades = VGroup()
        grade_labels = ["9th", "10th", "11th", "12th"]
        colors = [BLUE_D, BLUE_C, BLUE_B, BLUE_A]

        for i, (label, color) in enumerate(zip(grade_labels, colors)):
            grade_box = VGroup()
            rect = Rectangle(width=1.5, height=2, color=color, fill_opacity=0.3)
            label_text = Text(label, font_size=20)
            label_text.next_to(rect, UP, buff=0.1)

            # Add dots for students
            dots = VGroup()
            for row in range(4):
                for col in range(3):
                    dot = Dot(
                        point=rect.get_center() + LEFT * 0.4 + RIGHT * col * 0.35 + UP * 0.6 + DOWN * row * 0.35,
                        radius=0.08,
                        color=color
                    )
                    dots.add(dot)

            grade_box.add(rect, label_text, dots)
            grade_box.shift(LEFT * 3.5 + RIGHT * i * 2.2)
            grades.add(grade_box)

        grades.center().shift(UP * 0.5)

        self.play(FadeIn(grades))
        self.wait(1)

        self.play(FadeOut(scenario))

        # Stratified explanation
        strat_title = Text("STRATIFIED SAMPLING", font_size=32, color=GREEN)
        strat_title.to_edge(DOWN, buff=2.5)
        self.play(Write(strat_title))

        strat_desc = Text(
            "Select random students FROM EACH grade",
            font_size=24
        )
        strat_desc.next_to(strat_title, DOWN, buff=0.2)
        self.play(Write(strat_desc))
        self.wait(1)

        # Animate stratified selection
        all_selected = []
        for grade in grades:
            dots = grade[2]  # The dots group
            for j, dot in enumerate(dots):
                if j < 3:  # Select first 3 from each
                    all_selected.append(dot)

        self.play(
            *[dot.animate.set_color(GREEN).scale(1.5) for dot in all_selected],
            run_time=2
        )

        strat_result = Text("Result: 3 students from EACH grade (12 total)", font_size=20, color=YELLOW)
        strat_result.next_to(strat_desc, DOWN, buff=0.2)
        self.play(Write(strat_result))
        self.wait(2)

        # Reset and show cluster
        self.play(
            FadeOut(strat_title),
            FadeOut(strat_desc),
            FadeOut(strat_result),
            *[dot.animate.set_color(grade[0].get_color()).scale(1/1.5)
              for grade, dot_list in zip(grades, [grade[2] for grade in grades])
              for dot in dot_list]
        )

        # Cluster explanation
        clust_title = Text("CLUSTER SAMPLING", font_size=32, color=GREEN)
        clust_title.to_edge(DOWN, buff=2.5)
        self.play(Write(clust_title))

        clust_desc = Text(
            "Select ALL students from randomly chosen grades",
            font_size=24
        )
        clust_desc.next_to(clust_title, DOWN, buff=0.2)
        self.play(Write(clust_desc))
        self.wait(1)

        # Animate cluster selection (select grades 2 and 4)
        selected_grades = [1, 3]  # 10th and 12th grade

        for i, grade in enumerate(grades):
            if i in selected_grades:
                rect = grade[0]
                dots = grade[2]
                self.play(
                    rect.animate.set_fill(GREEN, opacity=0.5).set_stroke(GREEN, width=4),
                    *[dot.animate.set_color(GREEN).scale(1.3) for dot in dots],
                    run_time=1
                )
            else:
                rect = grade[0]
                dots = grade[2]
                self.play(
                    rect.animate.set_opacity(0.3),
                    *[dot.animate.set_opacity(0.3) for dot in dots],
                    run_time=0.5
                )

        clust_result = Text("Result: ALL students from 10th & 12th only (24 total)", font_size=20, color=YELLOW)
        clust_result.next_to(clust_desc, DOWN, buff=0.2)
        self.play(Write(clust_result))
        self.wait(2)

        # Final comparison
        self.play(
            FadeOut(grades),
            FadeOut(clust_title),
            FadeOut(clust_desc),
            FadeOut(clust_result)
        )

        comparison = VGroup(
            Text("STRATIFIED: Guarantees representation from ALL groups", font_size=24),
            Text("CLUSTER: More practical when groups are geographically spread", font_size=24),
        ).arrange(DOWN, buff=0.5)
        comparison.center()

        self.play(Write(comparison[0]))
        self.wait(1)
        self.play(Write(comparison[1]))
        self.wait(2)

        box = SurroundingRectangle(comparison, color=YELLOW, buff=0.3)
        self.play(Create(box))
        self.wait(2)
