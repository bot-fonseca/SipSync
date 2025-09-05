import 'package:flutter/material.dart';
import 'package:sipsync/views/pages/login_page.dart';
import 'package:sipsync/views/widgets/hero_widget.dart';

class RegisterPage extends StatelessWidget {
  const RegisterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(25.0),
          child: Column(
            children: [
              SizedBox(width: 400, child: HeroWidget(title: 'Create account')),
              SizedBox(height: 12),
              TextField(
                // controller: controllerEmail,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  hintText: 'Name/username',
                ),
                // onEditingComplete: () => setState(() {}),
              ),
              SizedBox(height: 12),
              TextField(
                // controller: controllerEmail,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  hintText: 'Insert Age',
                ),
                // onEditingComplete: () => setState(() {}),
              ),
              SizedBox(height: 12),
              TextField(
                // controller: controllerEmail,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  hintText: 'Insert your height',
                ),
                // onEditingComplete: () => setState(() {}),
              ),
              SizedBox(height: 12),
              TextField(
                // controller: controllerEmail,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  hintText: 'Insert your weight',
                ),
                // onEditingComplete: () => setState(() {}),
              ),
              SizedBox(height: 12),
              TextField(
                // controller: controllerEmail,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  hintText: 'Insert your Email',
                ),
                // onEditingComplete: () => setState(() {}),
              ),
              SizedBox(height: 12),
              TextField(
                // controller: controllerEmail,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  hintText: 'Insert your Password',
                ),
                // onEditingComplete: () => setState(() {}),
              ),
              SizedBox(height: 12),
              FilledButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) {
                        return LoginPage(title: 'Login');
                      },
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: Size(double.infinity, 50),
                ),
                child: Text('Register'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
