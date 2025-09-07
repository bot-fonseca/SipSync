import 'package:flutter/material.dart';
import 'package:sipsync/data/notifiers.dart';
import 'package:sipsync/views/pages/resetPassword_page.dart';
import 'package:sipsync/views/pages/resetUserName_page.dart';
import 'package:sipsync/views/pages/welcome_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(20),
      child: Column(
        children: [
          CircleAvatar(
            radius: 70,
            backgroundImage: AssetImage('assets/images/water2.jpg'),
          ),
          SizedBox(height: 50),
          ListTile(
            title: Text('Change Username'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) {
                    return ResetusernamePage(); //ctrl + click to open, ha que mudar a pagina
                  },
                ),
              );
            },
          ),

          ListTile(
            title: Text('Change Password'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) {
                      return ResetpasswordPage(); //ctrl + click to open, ha que mudar a pagina
                  },
                ),
              );
            },
          ),
          ListTile(
            title: Text('Log out'),
            onTap: () {
              selectedPageNotifier.value = 0;
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) {
                    return WelcomePage();
                  },
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
